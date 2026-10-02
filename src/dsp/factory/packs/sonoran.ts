import { type FactoryPreset } from '../types'

// Sonoran Night Air: analogue pads that breathe as slowly as a sleeper, deep drones,
// night insects and soft echoing patterns, all left in the largest halls there are.

export const PRESETS: readonly FactoryPreset[] = [
  // aurora: the two-layer polysynth, slow to speak
  {
    id: 'sonoran-sleepers-breath',
    name: "Sleeper's breath",
    category: 'pad',
    description:
      'A brass and string chord that takes two seconds to speak, its filter opening and closing every eight, in a vast hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 900, attack: 2, swell: 0.8, release: 6, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1100, resonance: 1, lfoAmount: 40, lfoRateHz: 0.125 },
      },
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, size: 0.8, decay: 14 } },
    ],
  },
  {
    id: 'sonoran-rimrock-strings',
    name: 'Rimrock strings',
    category: 'pad',
    description:
      'Two string layers sixteen cents apart with a two-second bow, thickened by an ensemble chorus in a cathedral.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 2600, attack: 2.2, release: 6, detune: 16, volume: -5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-far-ridge-horns',
    name: 'Far ridge horns',
    category: 'pad',
    description:
      'Muted synth horns that swell in over two and a half seconds, printed to clean tape and set far back in a long hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { lowCut: 120, attack: 2.5, release: 6, volume: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'sonoran-starfield-voices',
    name: 'Starfield voices',
    category: 'pad',
    description:
      'A narrow resonant band that sounds half sung, rising over three seconds into a hall whose tail sings back.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { resonance: 0.65, attack: 3, release: 8, volume: -12 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Cathedral choir', params: { mix: 0.4 } }],
  },
  {
    id: 'sonoran-first-light-iron',
    name: 'First light iron',
    category: 'pad',
    description:
      'Each note opens with a falling metal ring that melts into the pad, repeated by a dark echo in a twelve-second hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 1400, attack: 1.2, release: 8, ring: 0.45, volume: -10.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        params: { mix: 0.4, decay: 12, damping: 0.5, size: 1.6, breathDepth: 0 },
      },
    ],
  },
  {
    id: 'sonoran-far-headlights',
    name: 'Far headlights',
    category: 'pad',
    description:
      'One brass voice whose filter overshoots and settles on every note, turning in a slow phaser and a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { resonance: 0.4, contour: 0.8, attack: 0.9, release: 5, detune: 5, volume: 0 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },

  // dusk: the chorus polysynth; its own chorus is the sound, so none is added
  {
    id: 'sonoran-blue-hour-pad',
    name: 'Blue hour pad',
    category: 'pad',
    description:
      'Saw and moving pulse under both choruses, two seconds to arrive, the filter drifting open and shut in a very large room.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: {
        sub: 0.45,
        cutoff: 1200,
        envelope: 0.35,
        attack: 2,
        release: 6,
        chorus: 3,
        volume: -14,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1600, resonance: 0.9, lfoAmount: 45, lfoRateHz: 0.1 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, decay: 16 } },
    ],
  },
  {
    id: 'sonoran-arroyo-pulse',
    name: 'Arroyo pulse',
    category: 'pad',
    description:
      'A thin moving pulse with no sub octave, clouded by twelve phaser stages and left in a cathedral.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { cutoff: 2600, attack: 1.6, release: 5, volume: -11 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve Stage Cloud', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-ground-at-dusk',
    name: 'Ground at dusk',
    category: 'drone',
    description:
      'Square wave and full sub octave under a nearly shut filter, pushed into tape: a dark floor to build on.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 500, resonance: 0.2, attack: 2.5, release: 7, chorus: 2, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: -4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, decay: 9 } },
    ],
  },
  {
    id: 'sonoran-singing-wire',
    name: 'Singing wire',
    category: 'pad',
    description:
      'The filter ringing two octaves above each key like wind in a wire, with a chorused echo and a plain long hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { resonance: 0.9, attack: 1.2, release: 6, volume: -7.3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 520, mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.4, decay: 8 } },
    ],
    preview: 'line',
  },
  {
    id: 'sonoran-cereus-opening',
    name: 'Cereus opening',
    category: 'pad',
    description:
      'A chord that starts shut and needs three seconds to open and nine to close again, in a twenty-second hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 260, resonance: 0.35, envelope: 0.9, release: 9, volume: -13 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'sonoran-tail-light-echoes',
    name: 'Tail light echoes',
    category: 'keys',
    description:
      'Sawtooth notes that open at once and close as they fade, softened by dark echoes into a rolling pattern in a hall.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0.2,
        cutoff: 600,
        resonance: 0.3,
        envelope: 0.6,
        attack: 0.004,
        release: 0.5,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.55, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // drone: deep, slow, never still
  {
    id: 'sonoran-basin-floor',
    name: 'Basin floor',
    category: 'drone',
    description:
      'Stacked octaves over a heavy sub under a low filter, four seconds to rise, hanging in a minute-long space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { movement: 0.7, sub: 0.9, cutoff: 420, attack: 4, volume: -10 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.35 } }],
  },
  {
    id: 'sonoran-overtone-hum',
    name: 'Overtone hum',
    category: 'drone',
    description:
      'A buzzing harmonic series sung back by a hall of moving vowels, like overtone chant from the far end of a cave.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        wave: 0.85,
        movement: 0.9,
        rate: 0.35,
        sub: 0.3,
        air: 0.1,
        cutoff: 1100,
        attack: 2,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Moving vowels', params: { mix: 0.45, lowCut: 60 } },
    ],
  },
  {
    id: 'sonoran-cooling-ground',
    name: 'Cooling ground',
    category: 'drone',
    description:
      'A just minor chord of dull tones over a sub, five seconds to rise, turning in a deep phaser in a cathedral.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { movement: 0.7, cutoff: 800, attack: 5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { rate: 0.07, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-moonlit-dust',
    name: 'Moonlit dust',
    category: 'drone',
    description:
      'A cluster of sines a tone or less apart with air between them, smeared into a pale cloud that never settles.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { air: 0.6, cutoff: 2000, attack: 6, width: 0.7, volume: -9 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.35, width: 0.8 } },
    ],
    preview: 'hold',
  },
  {
    id: 'sonoran-power-line-hum',
    name: 'Power line hum',
    category: 'drone',
    description:
      'Fifths with a buzz in them, nearly still, combed by a slow flanger like wires humming over an empty road.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        wave: 0.55,
        movement: 0.3,
        rate: 0.05,
        sub: 0.4,
        cutoff: 1500,
        attack: 2.5,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, decay: 8 } },
    ],
  },
  {
    id: 'sonoran-zenith-glow',
    name: 'Zenith glow',
    category: 'drone',
    description:
      'A just major chord of soft tones with air around it, opening into a reverb that climbs an octave.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { partials: 0.9, air: 0.35, cutoff: 6000, attack: 4, width: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.35, width: 0.5 } },
    ],
    preview: 'hold',
  },

  // ember: the subtractive polysynth, pads first and one pattern voice
  {
    id: 'sonoran-warm-adobe-pad',
    name: 'Warm adobe pad',
    category: 'pad',
    description:
      'Two detuned saws and a sub, the filter rising and falling every ten seconds, in a deep slow chorus and a huge room.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        cutoff: 1000,
        ampAttack: 2,
        ampRelease: 6,
        lfo1Rate: 0.1,
        lfo1Amount: 0.3,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-bajada-drone',
    name: 'Bajada drone',
    category: 'drone',
    description:
      'A saw over a pulse an octave down and a sub, nearly closed and slowly stirred, through a transformer into a cathedral.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { cutoff: 220, ampAttack: 3.5, volume: -9.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-thin-high-air',
    name: 'Thin high air',
    category: 'pad',
    description:
      'Saws an octave apart with a breath of noise, two and a half seconds to arrive, widened a few cents in a long hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        oscMix: 0.65,
        noiseLevel: 0.08,
        cutoff: 6500,
        ampAttack: 2.5,
        ampRelease: 7,
        unisonSpread: 0.7,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.4, decay: 9 } },
    ],
  },
  {
    id: 'sonoran-ocotillo-pattern',
    name: 'Ocotillo pattern',
    category: 'keys',
    description:
      'A short triangle and pulse pluck whose filter snaps shut, multiplied by dark echoes until the pattern blurs.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: {
        cutoff: 700,
        filterDecay: 0.3,
        filterSustain: 0.2,
        ampDecay: 0.9,
        ampRelease: 0.5,
        velToAmp: 0.3,
        volume: 2,
        filterEnvAmount: 0.45,
        ampAttack: 0.004,
        ampSustain: 0.15,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 250, feedback: 0.6, spread: 0.8, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sonoran-dry-wind-rising',
    name: 'Dry wind rising',
    category: 'texture',
    description:
      'Mostly noise through a band-pass that climbs over three seconds and wanders, panned slowly from side to side in a huge room.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        resonance: 0.5,
        filterEnvAmount: 0.6,
        filterAttack: 3,
        ampAttack: 2,
        ampRelease: 5,
        lfo1Rate: 0.15,
        lfo1Dest: 1,
        lfo1Amount: 0.4,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'sonoran-edgeless-hour',
    name: 'Edgeless hour',
    category: 'pad',
    description:
      'Three detuned saws that fade in over three seconds while the filter takes four to open, in a slow phaser and a long hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        filterSlope: 1,
        cutoff: 400,
        resonance: 0.2,
        filterEnvAmount: 0.55,
        filterAttack: 4,
        filterDecay: 5,
        filterSustain: 0.6,
        filterRelease: 6,
        ampAttack: 3,
        ampRelease: 6,
        volume: -11.5,
        unisonSpread: 0.7,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // ladder-bass: patterns softened by echo, pedal tones and subs
  {
    id: 'sonoran-night-road-pulse',
    name: 'Night road pulse',
    category: 'keys',
    description:
      'Short bass notes that open and shut, with dark echoes filling the gaps until the pattern rolls on by itself.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Sequence bass',
      params: { cutoff: 500, contour: 0.65, decay: 0.45, volume: 1 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.5, mix: 0.38 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'sonoran-pedal-under-stars',
    name: 'Pedal under stars',
    category: 'drone',
    description:
      'Two saws beating slowly over a sub under a half-shut filter, held as long as the key, in a drifting chorus and a huge room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 11, sub: 0.7, cutoff: 300, volume: -8.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, lowCut: 40 } },
    ],
  },
  {
    id: 'sonoran-ground-sub',
    name: 'Ground sub',
    category: 'drone',
    description:
      'A sub tone with almost nothing above it, pushed into a tape preamp that adds a little harmonic for smaller speakers.',
    instrument: { deviceId: 'ladder-bass', preset: 'Soft sub', params: { volume: -2 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -14.5 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sonoran-slow-sundown-bass',
    name: 'Slow sundown bass',
    category: 'drone',
    description:
      'Every note starts open and resonant, then spends seven seconds closing and fading, phased gently in a long hall.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: { cutoff: 130, emphasis: 0.7, contour: 0.85, decay: 7, volume: -5.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass Safe', params: { rate: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sonoran-jackrabbit-run',
    name: 'Jackrabbit run',
    category: 'keys',
    description:
      'A rubbery resonant pluck, a little overdriven, chased by chorused echoes a third of a second apart.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { cutoff: 800, decay: 0.8, volume: 6, sub: 0.4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 333, feedback: 0.5, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'sonoran-lone-coyote-lead',
    name: 'Lone coyote lead',
    category: 'keys',
    description:
      'A round solo voice that slides between notes, answered by long murky echoes in a cathedral.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: { cutoff: 1200, glide: 0.2, volume: -1 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },

  // outdoors: what is awake after dark
  {
    id: 'sonoran-porch-crickets',
    name: 'Porch crickets',
    category: 'texture',
    description:
      'Crickets a few steps away on a warm night, each keeping its own time, with only a little air round them.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { density: 0.5, distance: 0.25, attack: 1.5, volume: -1.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } }],
  },
  {
    id: 'sonoran-far-field-crickets',
    name: 'Far field crickets',
    category: 'texture',
    description:
      'A whole field of crickets heard from a long way off, softened by distance and washed into the open.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: { distance: 0.7, movement: 0.8, tone: 0.35, volume: 2.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 9000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 6 } },
    ],
  },
  {
    id: 'sonoran-slowed-insects',
    name: 'Slowed insects',
    category: 'texture',
    description:
      'Crickets played at half speed, an octave down, so each chirp becomes a slow soft pulse in a huge space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { density: 0.8, attack: 2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { spread: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
  },
  {
    id: 'sonoran-toads-after-rain',
    name: 'Toads after rain',
    category: 'texture',
    description:
      'Toads calling from standing water a field away, recorded to quarter-inch tape with a little room.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: { density: 0.5, distance: 0.6, tone: 0.4, volume: 3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sonoran-far-dry-thunder',
    name: 'Far dry thunder',
    category: 'texture',
    description:
      'Thunder from beyond the horizon, one roll with the key and another about every half minute, in open night air.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { distance: 0.9, tone: 0.3, volume: -2 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -46 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, decay: 12, lowCut: 30 } },
    ],
  },
  {
    id: 'sonoran-courtyard-chimes',
    name: 'Courtyard chimes',
    category: 'bell',
    description:
      'Wind chimes tuned to the held keys, stirred by a breeze and smeared by slow grains into a soft metal haze.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.5, distance: 0.5, tone: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { spread: 0.5, mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.35, decay: 7 } },
    ],
    preview: 'chord',
  },

  // string-machine: the ensemble, slowed and set far off
  {
    id: 'sonoran-last-light-strings',
    name: 'Last light strings',
    category: 'string',
    description:
      'A string ensemble that takes three seconds to arrive, dull and wide, turning in a slow phaser in a cathedral.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 3, tone: 1600, volume: -7.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-high-cirrus',
    name: 'High cirrus',
    category: 'string',
    description:
      'Only the top octave of the ensemble, thin and without weight, its filter moving once every eleven seconds in a long hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.8, release: 6, tone: 7000, speed: 0.8, volume: -12 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { cutoffHz: 5000, lfoAmount: 30, lfoRateHz: 0.09 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.4, decay: 9 } },
    ],
  },
  {
    id: 'sonoran-dry-wash-cellos',
    name: 'Dry wash cellos',
    category: 'string',
    description:
      'The low octave alone under a closed tone filter, on quarter-inch tape, let into the reverb in slow waves.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.5, release: 5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-half-speed-ensemble',
    name: 'Half-speed ensemble',
    category: 'string',
    description:
      'All three octaves through the ensemble at half its usual speed, drifting in pitch, into a reverb that swells after the chord.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 2.2, release: 5, tone: 2400, ensemble: 1, speed: 0.45, drift: 0.65 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } }],
  },
  {
    id: 'sonoran-jet-trail',
    name: 'Jet trail',
    category: 'string',
    description:
      'Bare sawtooth octaves with the ensemble off, swept by one slow flanger like a jet crossing high overhead, in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 1.2, release: 4, tone: 4000, width: 0.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'sonoran-strings-below-ground',
    name: 'Strings below ground',
    category: 'string',
    description:
      'The upper octaves of a string ensemble, with their own copy an octave down at half speed for a floor, in a huge room.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 1.4,
        release: 5,
        low: 0.1,
        high: 0.6,
        tone: 2800,
        ensemble: 0.7,
        speed: 0.7,
        drift: 0.4,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },

  // wavetable: timbres that move over many seconds
  {
    id: 'sonoran-starlight-glass',
    name: 'Starlight glass',
    category: 'pad',
    description:
      'A glassy wavetable drifting through its shapes over twelve seconds, two seconds to arrive, in a slow chorus and a huge room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.75,
        motion: 0.6,
        rate: 0.08,
        sub: 0.1,
        cutoff: 9000,
        attack: 2,
        release: 6,
        spread: 0.4,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 50, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
  },
  {
    id: 'sonoran-voices-in-rock',
    name: 'Voices in rock',
    category: 'pad',
    description:
      'A table of vowels morphing slowly under a three-second attack, half sung and half synthetic, in a cathedral.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { rate: 0.06, cutoff: 3000, attack: 3, spread: 0.5, volume: -12 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral' }],
  },
  {
    id: 'sonoran-slot-canyon-air',
    name: 'Slot canyon air',
    category: 'pad',
    description:
      'A hollow, resonant table that drifts under a low filter, in a cave built from many dull echoes.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { cutoff: 1500, resonance: 0.4, attack: 2.5 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } }],
  },
  {
    id: 'sonoran-satellite-pass',
    name: 'Satellite pass',
    category: 'pad',
    description:
      'A spectral table crossing slowly from dull to bright, phased by a fraction of a hertz in a fourteen-second hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { rate: 0.05, cutoff: 7000, attack: 3, spread: 0.5, volume: -12.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { width: 0.3, mix: 0.4 } },
      { deviceId: 'fdn-reverb', params: { mix: 0.4, decay: 14, size: 1.8, breathDepth: 0 } },
    ],
  },
  {
    id: 'sonoran-still-ground-tone',
    name: 'Still ground tone',
    category: 'drone',
    description:
      'Near sines with a strong sub and no motion at all, on clean tape: one steady tone for the floor of a piece.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { sub: 0.7, cutoff: 800, attack: 3, spread: 0.2, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sonoran-slow-saw-dawn',
    name: 'Slow saw dawn',
    category: 'pad',
    description:
      'A reed that turns into a sawtooth and back over sixteen seconds, under a breathing filter in a long plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.3,
        motion: 0.9,
        rate: 0.06,
        detune: 12,
        cutoff: 2000,
        attack: 2.2,
        release: 6,
        spread: 0.8,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1500, lfoAmount: 40, lfoRateHz: 0.11 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // acoustic-guitar: the pick taken off, the room made enormous
  {
    id: 'sonoran-porch-twelve-string',
    name: 'Porch twelve string',
    category: 'plucked',
    description:
      'A twelve-string chord dragged slowly across, its pick softened by a swell, hanging in a huge room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { sustain: 12, release: 6, tone: 0.5, strum: 70, volume: -2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 250 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-nylon-after-dark',
    name: 'Nylon after dark',
    category: 'plucked',
    description:
      'Soft nylon strings played with the flesh of the finger, each note followed by its own shadow backwards, in a cathedral.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.1, release: 4, volume: 2 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // atmosphere: night weather
  {
    id: 'sonoran-playa-wind',
    name: 'Playa wind',
    category: 'texture',
    description:
      'A low steady wind with slow gusts and no whistle, narrowed a little and left to cross a very large space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { movement: 0.75, tone: 0.35, attack: 3, release: 6, width: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 8, width: 0.8 } },
    ],
  },
  {
    id: 'sonoran-small-hours-fire',
    name: 'Small hours fire',
    category: 'texture',
    description:
      'A small fire burning down close by, its crackle softened by tape, with a dark room behind it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.35, tone: 0.4, width: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
  },

  // bowed-string: the sustained guitar string and a low bowed drone
  {
    id: 'sonoran-singing-string',
    name: 'Singing string',
    category: 'string',
    description:
      'A string held singing by a magnetic sustainer, two seconds to rise with no pick in it, doubled a few cents apart in a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      params: { attack: 2, release: 5, brightness: 0.4, vibrato: 0.08, volume: -10.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { width: 0.25, mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.28 } },
    ],
    preview: 'line',
  },
  {
    id: 'sonoran-low-bow-drone',
    name: 'Low bow drone',
    category: 'drone',
    description:
      'A low bowed string with heavy pressure and a wooden body, doubled by a drifting chorus in a cathedral.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1.5, release: 4, pressure: 0.65, vibrato: 0.1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // chamber-strings: muted, without vibrato, far away
  {
    id: 'sonoran-muted-dusk-section',
    name: 'Muted dusk section',
    category: 'string',
    description:
      'Five muted players with no vibrato, two and a half seconds into every chord, the top taken off, in a long hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { release: 4, volume: -12 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 9000 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sonoran-still-bows',
    name: 'Still bows',
    category: 'string',
    description:
      'Three players with almost no bow noise and no vibrato, their chord held on by a spectral blur in a huge room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 2.2, release: 5, volume: -11.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.8 } },
    ],
  },

  // choir: low and wordless
  {
    id: 'sonoran-low-stone-voices',
    name: 'Low stone voices',
    category: 'voice',
    description:
      'Deep voices on a closed oo with no vibrato, two and a half seconds to gather, in a hall that hums the vowel back.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 2.5, release: 5, tone: 2600 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } }],
  },
  {
    id: 'sonoran-slow-night-vowels',
    name: 'Slow night vowels',
    category: 'voice',
    description:
      'Singers morphing from vowel to vowel while they hold, three seconds to arrive, in a deep slow chorus and a ten-second hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { ensemble: 0.7, vibrato: 0, tone: 4000, volume: -8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4, decay: 10, size: 1.5 } },
    ],
  },

  // chord-harp: strummed slowly, or only its pad
  {
    id: 'sonoran-starlit-slow-strum',
    name: 'Starlit slow strum',
    category: 'plucked',
    description:
      'A chord swept slowly up and down across four octaves of soft strings, with long murky echoes in a huge room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { tone: 0.3, volume: -4.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-harp-pad-glow',
    name: 'Harp pad glow',
    category: 'pad',
    description:
      'Mostly the pad layer under the strings, the plucks faded in by a swell, rising an octave in a ten-second reverb.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 60, sustain: 4, tone: 0.45, pad: 0.9, volume: -18.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { mix: 0.35, decay: 10, shimmer: 0.3 },
      },
    ],
  },

  // clarinet: a growled low drone and a plain reed line
  {
    id: 'sonoran-hollow-log-drone',
    name: 'Hollow log drone',
    category: 'drone',
    description:
      'A low reed blown with a growl while a resonant peak wanders through its overtones, in a cave of short echoes.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.55, breath: 0.6, attack: 0.6, release: 1.5, growl: 0.55, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 4, cutoffHz: 420, resonance: 5, lfoAmount: 55, lfoRateHz: 0.4 },
      },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'sonoran-moonset-reed',
    name: 'Moonset reed',
    category: 'wind',
    description:
      'A clarinet that comes from nothing on every note, breathy and plain, with a far echo that remembers the last minute.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { breath: 0.55, attack: 1.8, volume: 0 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Distant minute', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },

  // felt-piano: a piano with its edges removed
  {
    id: 'sonoran-piano-rising-as-pad',
    name: 'Piano rising as pad',
    category: 'keys',
    description:
      'A felted piano with every hammer faded out by a swell, so chords rise like a pad into a reverb that blooms after them.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Hall',
      params: {
        felt: 0.8,
        hardness: 0.25,
        thump: 0.2,
        outputDb: -6,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-looped-felt-notes',
    name: 'Looped felt notes',
    category: 'keys',
    description:
      'Close, soft felt piano with its action noise left in, coming round again on a four-second tape loop in a long hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0.1, outputDb: -15 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { feedback: 0.6, mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // flute: a wooden flute against a far wall, and breath as a pad
  {
    id: 'sonoran-cedar-flute-echo',
    name: 'Cedar flute echo',
    category: 'wind',
    description:
      'A wooden flute with a scoop into each note and a breath vibrato, its phrases coming back dull off a distant wall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.4, attack: 0.08, release: 1.2, scoop: 60 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 640, feedback: 0.4, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-slow-air-flutes',
    name: 'Slow air flutes',
    category: 'wind',
    description:
      'Low flutes blown so softly they are mostly breath, a second and a half to speak, drifting in a chorus and a long hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.8, blow: 0.22, release: 4, volume: -13.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4, decay: 9 } },
    ],
    preview: 'chord',
  },

  // fm-glass: glass slowed into a pad, and one struck bowl
  {
    id: 'sonoran-night-glass-pad',
    name: 'Night glass pad',
    category: 'pad',
    description:
      'A soft FM pad that takes two and a half seconds to arrive, its operators beating slowly, widened in a huge room.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { brightness: 0.5, spread: 0.6, volume: -13.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle Widener' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-late-struck-bowl',
    name: 'Late struck bowl',
    category: 'bell',
    description:
      'A struck bowl with a nine-second ring, each strike repeated by dull echoes inside a twelve-second hall.',
    instrument: { deviceId: 'fm-glass', preset: 'Temple bowl', params: { brightness: 0.35 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 700, mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        params: { mix: 0.4, decay: 12, damping: 0.6, size: 1.5, breathDepth: 0 },
      },
    ],
  },

  // grain-synth: whatever is loaded, frozen or run backwards
  {
    id: 'sonoran-frozen-hour',
    name: 'Frozen hour',
    category: 'pad',
    description:
      'One moment of whatever sound is loaded, held still as a pad that takes two and a half seconds to rise, in a huge room.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { size: 600, attack: 2.5, release: 6, tone: 5000, volume: -20 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, decay: 14 } }],
  },
  {
    id: 'sonoran-backwards-night-air',
    name: 'Backwards night air',
    category: 'pad',
    description:
      'Long reversed grains of whatever sound is loaded, scanning slowly backwards under a soft filter in a cathedral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { tone: 3500, volume: -17.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // guitar: swelled chords and a looper
  {
    id: 'sonoran-swelled-guitar-sky',
    name: 'Swelled guitar sky',
    category: 'plucked',
    description:
      'Electric guitar chords with two seconds of swell on every note, no pick heard, in an ensemble chorus and a huge room.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { sustain: 24, tone: 2600, swell: 2 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 6 } },
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-looped-guitar-dusk',
    name: 'Looped guitar dusk',
    category: 'plucked',
    description:
      'Soft neck-pickup notes caught by a looper that plays them back at half speed underneath, in a ten-second hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.3, tone: 2800, warmth: 0.5, volume: 1 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { fade: 0.5, mix: 0.33 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4, decay: 10 } },
    ],
  },

  // handpan: struck like a water jar, or slowed
  {
    id: 'sonoran-water-jar-tones',
    name: 'Water jar tones',
    category: 'bell',
    description:
      'A tongue drum struck softly with a deep thump of air under each note, like a water jar, with dull echoes in a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 4, touch: 0.2, cavity: 0.9, damp: 0.25, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 500, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
  },
  {
    id: 'sonoran-half-speed-pan',
    name: 'Half speed pan',
    category: 'bell',
    description:
      'A low steel pan with its own notes replayed an octave down and twice as slow beneath it, in a huge room.',
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { touch: 0.25, volume: -2 } },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Continuous octave',
        params: { highCut: 5000, spread: 0.5, mix: 0.5 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // harp: strings as haze
  {
    id: 'sonoran-harp-haze',
    name: 'Harp haze',
    category: 'plucked',
    description:
      'Harp strings plucked softly and rung long, replayed as a cloud of slow grains behind themselves in a plain long hall.',
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { touch: 0.1 } },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { size: 500, mix: 0.45 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.4, decay: 9 } },
    ],
  },
  {
    id: 'sonoran-silk-string-night',
    name: 'Silk string night',
    category: 'plucked',
    description:
      'A softly plucked silk string that bends up into each note, with echoes and stray memories of the phrase in a cathedral.',
    instrument: { deviceId: 'harp', preset: 'Soft silk', params: { volume: 1 } },
    effects: [
      { deviceId: 'echo-memory', preset: 'Remembering', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // horns: brass as weather
  {
    id: 'sonoran-night-air-brass',
    name: 'Night air brass',
    category: 'wind',
    description:
      'A full section of low brass blown softly, three seconds into each chord, thickened a little and set in a long plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 3, volume: -4.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal Thickener' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-valley-horn-line',
    name: 'Valley horn line',
    category: 'wind',
    description:
      'One horn section swelling into each note of a slow line, answered by murky echoes across a very large space.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 1.2, release: 3, volume: -3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // mallets: a rolled shimmer and a soft wooden pattern
  {
    id: 'sonoran-rolled-bar-shimmer',
    name: 'Rolled bar shimmer',
    category: 'bell',
    description:
      'Vibraphone chords rolled with soft mallets into a shimmer, the motor turning slowly, phased in a nine-second hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { motorRate: 1.5, roll: 8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.1, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4, decay: 9 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-wooden-pattern',
    name: 'Wooden pattern',
    category: 'bell',
    description:
      'Soft marimba notes over their resonators, doubled by echoes a third of a second behind so a slow pattern runs on.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.25, decay: 1.4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 333, feedback: 0.55, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },

  // modal-bells: rubbed and far away
  {
    id: 'sonoran-rubbed-bowl-sky',
    name: 'Rubbed bowl sky',
    category: 'bell',
    description:
      'Singing bowls rubbed rather than struck so they hold as long as the keys, with a copy an octave below, in a huge room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { volume: -16, spread: 0.6 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad octave below', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, decay: 16 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-horizon-gong',
    name: 'Horizon gong',
    category: 'bell',
    description:
      'A soft-struck gong with a thirty-second ring, its modes blurred together and set a long way off in a cathedral.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { hardness: 0.4, spread: 0.7, volume: -3 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // organ: pipes heard from a long way off, and a bellows drone
  {
    id: 'sonoran-distant-pipes-drift',
    name: 'Distant pipes drift',
    category: 'organ',
    description:
      'Dull pipes that take three seconds to fill with wind, through a slowly rotating speaker across the room, in a huge space.',
    instrument: { deviceId: 'organ', preset: 'Distant pipes', params: { volume: -13 } },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-bellows-drone',
    name: 'Bellows drone',
    category: 'drone',
    description:
      'A low reed-organ drone with a beating second rank and breathing bellows, on quarter-inch tape in a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { celeste: 0.7, bellows: 0.7, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // pedal-steel: steel with no country in it
  {
    id: 'sonoran-glass-steel-sky',
    name: 'Glass steel sky',
    category: 'plucked',
    description:
      'Steel guitar with a second and a half of pedal swell and no vibrato, ringing most of a minute, detuned wide in a huge room.',
    instrument: { deviceId: 'pedal-steel', preset: 'Still glass', params: { volume: -13.5 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thick double' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sonoran-open-road-slide',
    name: 'Open road slide',
    category: 'plucked',
    description:
      'Overlapping notes bend the held one by up to an octave over half a second, with chorused echoes in a long plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 1, pick: 0.25, volume: -4.3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 450, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // sampler: whatever is loaded, slowed and looped
  {
    id: 'sonoran-slowed-sample-pad',
    name: 'Slowed sample pad',
    category: 'pad',
    description:
      'Whatever sound is loaded, looped an octave down with two seconds of attack and a slow wobble, under a breathing filter.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 2, release: 5, tone: 3600, wobble: 0.35, volume: -17.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1800, lfoAmount: 40, lfoRateHz: 0.12 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'sonoran-turning-loop-pad',
    name: 'Turning loop pad',
    category: 'pad',
    description:
      'The middle of whatever sound is loaded played forwards then backwards without a seam at its own pitch, echoing in a cathedral.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: {
        tune: 0,
        fine: -8,
        attack: 1.4,
        release: 6,
        tone: 2400,
        wobble: 0.12,
        volume: -18.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // tanpura: the drone strings, buzzing and plain
  {
    id: 'sonoran-buzzing-drone-strings',
    name: 'Buzzing drone strings',
    category: 'drone',
    description:
      'Four drone strings plucked round every six seconds, each one buzzing open into a sweep of overtones, in a long dull reverb.',
    instrument: { deviceId: 'tanpura', preset: 'Slow wall', params: { speed: 6, volume: -6.5 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } }],
  },
  {
    id: 'sonoran-night-monochord',
    name: 'Night monochord',
    category: 'drone',
    description:
      'Four drone strings with no buzz at all, plain and long, thickened by a deep slow chorus in a long plate.',
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { speed: 6, volume: -3.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { spread: 40, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // tape-orchestra: orchestra tapes run slow
  {
    id: 'sonoran-half-speed-cellos',
    name: 'Half speed cellos',
    category: 'string',
    description:
      'A cello section on tape running at half speed, an octave down and slow to speak, in a dull minute-long space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 1.5, release: 4, tone: -0.2, volume: -10 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.35 } }],
  },
  {
    id: 'sonoran-old-tape-choir',
    name: 'Old tape choir',
    category: 'voice',
    description:
      'A taped choir that swells in over two seconds with a little wobble, turning in a slow phaser in a cathedral.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 2, release: 3.5, age: 0.45, tone: -0.2, volume: -7.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // thesis: wind given a chord
  {
    id: 'sonoran-whistling-rocks',
    name: 'Whistling rocks',
    category: 'pad',
    description:
      'Narrow bands of noise tuned to the chord and its mirror images, breathing slowly, like wind whistling through rock.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { attack: 2, release: 5, breatheRate: 0.12 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 10, outputGain: -5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-low-wind-bands',
    name: 'Low wind bands',
    category: 'texture',
    description:
      'Broad dull bands of noise drifting around a low centre, held as one long gust in a twenty-second hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { attack: 2, release: 3.5 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { outputGain: -6 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },

  // tine-piano: electric piano without its edge
  {
    id: 'sonoran-tines-crossing-slowly',
    name: 'Tines crossing slowly',
    category: 'keys',
    description:
      'A soft electric piano with long sustain, each note crossing slowly from side to side over sympathetic strings in a cathedral.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { bell: 0.4, tremoloRate: 0.3, tone: 0.4, volume: -15.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long resonance', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-strikeless-tines',
    name: 'Strikeless tines',
    category: 'keys',
    description:
      'Dull tines with the strike taken off by a swell, so a chord fades in like a pad and turns in a slow phaser in a huge room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 3, release: 1.5, volume: -12 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // west-coast: the modular voice, as a pattern and as a drone
  {
    id: 'sonoran-folded-pluck-pattern',
    name: 'Folded pluck pattern',
    category: 'plucked',
    description:
      'A woody folded pluck through a low-pass gate, its notes doubled by dark echoes into a soft running pattern.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.3, decay: 1.6, chance: 0.25, volume: -1, attack: 0.006, timbreEnv: 0.3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.55, spread: 0.9, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sonoran-slow-folding-drone',
    name: 'Slow folding drone',
    category: 'drone',
    description:
      'A tone that folds over itself more and less as it drifts, two and a half seconds to rise, in a deep phaser and a huge room.',
    instrument: { deviceId: 'west-coast', preset: 'Folding drone', params: { volume: -7 } },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { rate: 0.08, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // zither: open strings left to ring
  {
    id: 'sonoran-open-range-strings',
    name: 'Open range strings',
    category: 'plucked',
    description:
      'Doubled courses of open strings picked in octaves and left to ring, a soft pad growing behind them, in a huge room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { brightness: 0.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sonoran-rolled-open-chord',
    name: 'Rolled open chord',
    category: 'plucked',
    description:
      'An open chord rolled slowly up and down by the fingers on every key, with long murky echoes in a cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { roll: 1.5, brightness: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
]
