import { type FactoryPreset } from '../types'

// A few clear notes in a bright room with the garden just outside: clean electric
// pianos, early FM tones, bars and flutes, water and birds. Small rooms, short echoes.

export const PRESETS: readonly FactoryPreset[] = [
  // Tine piano: the instrument at the centre, clean and unhurried.
  {
    id: 'window-garden-museum-morning',
    name: 'Museum morning',
    category: 'keys',
    description:
      'A clean electric piano, more bell than bark and no tremolo, with a light chorus in a small room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.8, hardness: 0.6, tremolo: 0, tone: 0.75, volume: -12.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-sill-in-the-sun',
    name: 'Sill in the sun',
    category: 'keys',
    description:
      'Tines that cross slowly from side to side on their amplifier tremolo, in a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: {
        bell: 0.55,
        bark: 0.2,
        decay: 1.3,
        release: 0.5,
        tremolo: 0.6,
        tremoloRate: 0.7,
        volume: -12.5,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } }],
  },
  {
    id: 'window-garden-stepping-stones',
    name: 'Stepping stones',
    category: 'keys',
    description:
      'Short, clipped tines, each one answered by a dark bucket-brigade echo a third of a second on.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        bell: 0.5,
        bark: 0.25,
        decay: 0.55,
        release: 0.08,
        hardness: 0.85,
        tremolo: 0,
        tone: 0.6,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 330, feedback: 0.4, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-pond-glass',
    name: 'Pond glass',
    category: 'keys',
    description:
      'All bell and no bark: clear tines struck hard, turning in a slow phaser, with a short halo after each note.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 1, bark: 0.05, hardness: 0.9, tremolo: 0, tone: 0.85, volume: -13.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { depth: 60, mix: 0.3 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'window-garden-paper-screen',
    name: 'Paper screen',
    category: 'keys',
    description:
      'Soft, round tines with the top taken off, one quiet tape repeat and a small room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 1.2, release: 0.4, hardness: 0.3, tone: 0.3, volume: -14 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 240, feedback: 0.1, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'window-garden-afternoon-loop',
    name: 'Afternoon loop',
    category: 'keys',
    description:
      'Long-ringing tines whose last few notes keep turning quietly underneath as a short loop.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.55, tremolo: 0, tone: 0.5, volume: -15 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 2.5, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.6, mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-ceiling-speaker',
    name: 'Ceiling speaker',
    category: 'keys',
    description:
      'An electric piano heard from a small speaker across a quiet gallery, a little boxy and far off.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0.5, bark: 0.3, tremolo: 0.15, tone: 0.6, volume: -15 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { drive: 0.15, distance: 0.5, room: 0.45, noise: 0.05 },
      },
    ],
  },
  {
    id: 'window-garden-strings-behind-glass',
    name: 'Strings behind glass',
    category: 'keys',
    description:
      'Soft tines with a faint string pad that grows behind held notes and fades when they stop.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: {
        bell: 0.6,
        decay: 1.8,
        release: 0.8,
        hardness: 0.45,
        tremolo: 0.1,
        tone: 0.6,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2, highCut: 7000 } },
    ],
  },

  // Glass: the early digital keyboard, from its electric piano to plain sines.
  {
    id: 'window-garden-vitrine-keys',
    name: 'Vitrine keys',
    category: 'keys',
    description:
      'An early digital electric piano: an FM tine with a soft knock, through twelve-bit converters and a chorus.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { brightness: 0.4, decay: 2, release: 0.6, detune: 5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 22000, jitter: 0.05 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-sine-cell',
    name: 'Sine cell',
    category: 'bell',
    description:
      'Close to a sine: an FM mallet with its modulator nearly shut, coming round again on a four-second tape loop.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { ratio: 1, brightness: 0.1, decay: 3, attack: 0.004, detune: 2, velocity: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.6, wow: 0.12, mix: 0.3 },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-frost-on-the-basin',
    name: 'Frost on the basin',
    category: 'bell',
    description:
      'Short bright FM chimes, each scattering a few quick copies an octave up, in a small plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { brightness: 0.55, decay: 1, release: 2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { repeats: 5, mix: 0.2 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-buried-jar',
    name: 'Buried jar',
    category: 'bell',
    description:
      'Small inharmonic FM bells that drip into a patter of short echoes, like water in a buried jar.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: {
        brightness: 0.35,
        decay: 1.2,
        attack: 0.002,
        release: 1.5,
        spread: 0.5,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } }],
  },
  {
    id: 'window-garden-vibes-at-noon',
    name: 'Vibes at noon',
    category: 'bell',
    description:
      'FM vibraphone bars under a slow, shallow tremolo like a turning motor, in a small room.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { brightness: 0.35, decay: 3, release: 2, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2.5, depth: 0.35, phase: 60 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'window-garden-held-glass',
    name: 'Held glass',
    category: 'pad',
    description:
      'A held FM tone close to a sine, quick to speak and gently beating, widened a few cents either side.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: {
        ratio: 1,
        brightness: 0.2,
        attack: 0.25,
        release: 1.5,
        detune: 6,
        spread: 0.5,
        volume: -17.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.22 } },
    ],
  },
  {
    id: 'window-garden-platform-chime',
    name: 'Platform chime',
    category: 'bell',
    description:
      'A bright harmonic FM chime with a short two-head tape echo, like the tune before train doors close.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 7, brightness: 0.5, decay: 1.6, release: 1.2, detune: 2, feedback: 0 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 300, heads: 1, feedback: 0.35, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-porcelain-bowl',
    name: 'Porcelain bowl',
    category: 'bell',
    description: 'A soft, round FM bowl tone, struck gently and left to ring in a small plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { brightness: 0.35, decay: 5, attack: 0.01, release: 4, volume: -8 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { decay: 0.55, mix: 0.25 } }],
  },

  // Mallets: wooden and metal bars, soft sticks.
  {
    id: 'window-garden-cedar-bars',
    name: 'Cedar bars',
    category: 'bell',
    description: 'A marimba played with soft yarn mallets, round and woody, in a small dry room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.2, decay: 1.2, resonator: 0.9, width: 0.6, volume: -6.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } }],
  },
  {
    id: 'window-garden-still-vibraphone-echo',
    name: 'Still vibraphone echo',
    category: 'bell',
    description:
      'A vibraphone with its motor off and soft mallets, a chorused delay repeating each note in a short hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.3, decay: 2, damper: 0.2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 400, feedback: 0.35, mix: 0.25 },
      },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 2, mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-small-glockenspiel',
    name: 'Small glockenspiel',
    category: 'bell',
    description:
      'A glockenspiel struck lightly, bright and small, with one quiet tape repeat and a plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, decay: 1.3, resonator: 0.2, width: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { feedback: 0.1, mix: 0.2 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'window-garden-celesta-lesson',
    name: 'Celesta lesson',
    category: 'bell',
    description:
      'A celesta played quietly, its felt hammers soft, doubled a few cents wide in a small room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.35, decay: 1.2, damper: 0.4, width: 0.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'window-garden-rolled-wood-bed',
    name: 'Rolled wood bed',
    category: 'bell',
    description:
      'Held marimba chords rolled with soft mallets into an even shimmer, close and nearly dry.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.15, roll: 8, volume: -14.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'chord',
  },
  {
    id: 'window-garden-dry-wood-taps',
    name: 'Dry wood taps',
    category: 'bell',
    description:
      'A dry xylophone with a softened mallet and a plain echo counting after each note.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.5, decay: 1.3, resonator: 0.9, volume: -2 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 300, feedback: 0.3, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
  },

  // Bells: small struck things of metal and glass.
  {
    id: 'window-garden-chime-bars',
    name: 'Chime bars',
    category: 'bell',
    description:
      'Small metal bars struck with a firm beater and left to ring, with a gentle tape echo.',
    instrument: {
      deviceId: 'modal-bells',
      params: {
        material: 3,
        decay: 4,
        damping: 0.3,
        hardness: 0.6,
        position: 0.1,
        detune: 0.4,
        brightness: 0.55,
        release: 0.4,
        spread: 0.5,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: {
          time: 420,
          feedback: 0.35,
          wow: 0.25,
          flutter: 0.15,
          drive: 0.3,
          spread: 0.3,
          mix: 0.22,
        },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'window-garden-kalimba-on-a-bench',
    name: 'Kalimba on a bench',
    category: 'bell',
    description:
      'A kalimba plucked softly, with a short soft slap behind each tine and a little room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 3, damping: 0.6, hardness: 0.5, volume: -6.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 180, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-struck-tumbler',
    name: 'Struck tumbler',
    category: 'bell',
    description:
      'A drinking glass tapped with a fingernail: a clear pitch with a glint on top, in a small plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { decay: 5, hardness: 0.55, sustain: 0, brightness: 0.55, release: 0.5, volume: -5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } }],
  },
  {
    id: 'window-garden-tea-bowl',
    name: 'Tea bowl',
    category: 'bell',
    description:
      'A small singing bowl struck softly, its close tones beating slowly, in a small room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { decay: 7, hardness: 0.3, detune: 0.6, brightness: 0.4, volume: -6.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'window-garden-cool-bars',
    name: 'Cool bars',
    category: 'bell',
    description:
      'Modal vibraphone bars, struck softly and left undamped, widened a little in a small room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 6, hardness: 0.35, release: 0.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-singing-bowl-rim',
    name: 'Singing bowl rim',
    category: 'bell',
    description: 'A glass rubbed round its rim with a wet finger, held and pure, in a small room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { decay: 6, hardness: 0.15, sustain: 0.9, brightness: 0.35, volume: -6.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.8, mix: 0.22 } }],
    preview: 'line',
  },

  // Flute: single lines, blown softly.
  {
    id: 'window-garden-bamboo-flute-alone',
    name: 'Bamboo flute alone',
    category: 'wind',
    description:
      'An end-blown bamboo flute with breath in the tone and a scoop into each note, alone in a room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.5, chiff: 0.6, release: 0.9, vibrato: 0.3, scoop: 60, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'zita-rev1',
        preset: 'Room',
        params: { lowDecay: 1.8, midDecay: 1.6, mix: 0.25 },
      },
    ],
  },
  {
    id: 'window-garden-whistle-tone',
    name: 'Whistle tone',
    category: 'wind',
    description:
      'A flute blown so softly it is nearly a pure tone, with its own octave faintly above it, in a small plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: {
        breath: 0.2,
        blow: 0.2,
        attack: 0.08,
        release: 0.6,
        vibrato: 0.15,
        scoop: 0,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { dry: 1, up1: 0.3, up2: 0.1 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'window-garden-low-flutes-together',
    name: 'Low flutes together',
    category: 'wind',
    description:
      'Several low flutes holding a chord with almost no vibrato, soft-edged, in a medium room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { breath: 0.4, attack: 0.3, release: 1.5, vibrato: 0.1, volume: -15 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Small dark room',
        params: { size: 0.25, decay: 2, highCut: 8000, mix: 0.22 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'window-garden-pipes-in-the-yard',
    name: 'Pipes in the yard',
    category: 'wind',
    description:
      'Pan pipes with a puff at the front of each note and a soft dark echo half a second behind.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 0.7, release: 0.35, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 500, feedback: 0.3, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-open-door-flute',
    name: 'Open door flute',
    category: 'wind',
    description: 'A wooden flute played plainly in a small room and recorded to clean fast tape.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.35, attack: 0.05, vibrato: 0.25, scoop: 15, volume: -8 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, hiss: 0.05 } },
    ],
  },
  {
    id: 'window-garden-breath-on-glass',
    name: 'Breath on glass',
    category: 'pad',
    description: 'More breath than note: low flutes blown very gently into a soft, airy chord.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.8, blow: 0.2, attack: 0.8, release: 2, volume: -12 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // Outdoors: what is on the other side of the glass.
  {
    id: 'window-garden-birds-past-the-pane',
    name: 'Birds past the pane',
    category: 'texture',
    description:
      'A handful of garden birds heard from indoors, set back on the far side of the glass.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.5, distance: 0.7, attack: 1, volume: -3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 200, highCut: 5000 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'window-garden-bird-on-the-lantern',
    name: 'Bird on the lantern',
    category: 'texture',
    description: 'A single songbird a few steps away, phrase by phrase, almost dry.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'One blackbird',
      params: { distance: 0.1, tone: 0.55, attack: 0.3, volume: -8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.12 } }],
  },
  {
    id: 'window-garden-water-under-the-bridge',
    name: 'Water under the bridge',
    category: 'texture',
    description:
      'A small stream close by with the rumble taken out, its splashes thrown back by the stone arch overhead.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.4, distance: 0.15, tone: 0.6, attack: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 150 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-rain-chain',
    name: 'Rain chain',
    category: 'texture',
    description:
      'A thin, bright trickle running down a chain from the gutter, bubble by bubble, with a short halo.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Fast water',
      params: { density: 0.28, distance: 0.1, movement: 0.6, tone: 0.8, attack: 1, volume: -0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 300 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-glass-wind-bell',
    name: 'Glass wind bell',
    category: 'bell',
    description:
      'Wind chimes tuned from each key, one struck as it is pressed and more now and then in light air while it is held.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { density: 0.25, distance: 0.1, movement: 0.3, tone: 0.9, volume: -4.5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.15 } }],
  },
  {
    id: 'window-garden-frogs-across-the-pond',
    name: 'Frogs across the pond',
    category: 'texture',
    description: 'Sparse frogs calling from the far side of a pond, soft and set back.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: { density: 0.5, distance: 0.75, movement: 0.4, volume: 3.6 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 6000, mix: 0.15 } },
    ],
  },

  // Wavetable: plain digital tones, held.
  {
    id: 'window-garden-plain-tones',
    name: 'Plain tones',
    category: 'pad',
    description:
      'Near sines with an octave beneath, quick and soft to speak, in a light chorus and a small room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { detune: 5, sub: 0.3, cutoff: 2400, attack: 0.15, release: 1.2, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-glass-keys',
    name: 'Glass keys',
    category: 'keys',
    description:
      'A glassy digital tone played as keys: it speaks at once, holds, and leaves a chorused echo.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.52,
        motion: 0.2,
        sub: 0.05,
        cutoff: 8000,
        attack: 0.02,
        release: 1,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 360, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-hollow-afternoon',
    name: 'Hollow afternoon',
    category: 'pad',
    description:
      'A hollow, clarinet-like pad that drifts a little in tone, with a shallow phaser in a medium room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: {
        position: 0.3,
        motion: 0.3,
        cutoff: 2600,
        resonance: 0.1,
        attack: 0.4,
        release: 2,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-humming-next-door',
    name: 'Humming next door',
    category: 'pad',
    description:
      'A soft vowel pad, closer to humming than singing, in a small room that hums along.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        position: 0.85,
        motion: 0.3,
        detune: 8,
        cutoff: 4000,
        attack: 0.5,
        release: 2,
        spread: 0.6,
        volume: -13.5,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { width: 0.6, mix: 0.25 } }],
  },
  {
    id: 'window-garden-reed-line',
    name: 'Reed line',
    category: 'keys',
    description: 'A plain reed tone for single lines, with one tape repeat and a small room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.05,
        motion: 0.1,
        sub: 0.15,
        cutoff: 3000,
        attack: 0.06,
        release: 0.6,
        volume: -6.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 380, feedback: 0.1, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'window-garden-light-on-water',
    name: 'Light on water',
    category: 'pad',
    description:
      'A thin, bright pad whose upper partials glint and change every few seconds, with no bass under it.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: {
        position: 0.35,
        motion: 0.6,
        rate: 0.2,
        detune: 10,
        sub: 0,
        cutoff: 7000,
        attack: 0.6,
        release: 2.5,
        spread: 0.5,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 200 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // Acoustic guitar
  {
    id: 'window-garden-nylon-by-the-door',
    name: 'Nylon by the door',
    category: 'plucked',
    description:
      'A nylon-string guitar played with the fingertips, close enough to hear the air of the room around it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { body: 0.8, nail: 0.3, sustain: 4, release: 1.5, strum: 10, volume: 1.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -46 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-steel-left-ringing',
    name: 'Steel left ringing',
    category: 'plucked',
    description:
      'Bright steel strings picked near the bridge and left to ring over each other, evened out and doubled a little wide.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { position: 0.14, nail: 0.5, sustain: 8, release: 5, tone: 0.7, volume: 0 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },

  // Atmosphere
  {
    id: 'window-garden-rain-on-the-eaves',
    name: 'Rain on the eaves',
    category: 'texture',
    description:
      'Steady rain on the roof just overhead, single drops over a patter, recorded to clean tape.',
    instrument: {
      deviceId: 'atmosphere',
      params: {
        type: 1,
        density: 0.85,
        movement: 0.4,
        tone: 0.55,
        resonance: 0,
        size: 0.3,
        attack: 1.5,
        release: 5,
        width: 0.7,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.6, hiss: 0, output: -1 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'window-garden-leaves-moving',
    name: 'Leaves moving',
    category: 'texture',
    description: 'Light wind in leaves outside, rising and falling, with nothing low in it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.3,
        movement: 0.5,
        tone: 0.65,
        resonance: 0.05,
        size: 0.15,
        attack: 1.5,
        width: 0.7,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 200 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.1 } },
    ],
  },

  // Aurora
  {
    id: 'window-garden-round-brass-pad',
    name: 'Round brass pad',
    category: 'pad',
    description:
      'A round, soft brass pad that speaks quickly and does not swell, warmed by a preamp, in a small room.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: {
        brilliance: 1400,
        contour: 0.2,
        attack: 0.25,
        swell: 0.2,
        release: 1.5,
        detune: 5,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-thin-strings-by-day',
    name: 'Thin strings by day',
    category: 'pad',
    description:
      'Thin, bright synthesizer strings with the low end cut away, under a slow shallow flanger.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: {
        brilliance: 6000,
        lowCut: 400,
        attack: 0.3,
        release: 1.5,
        detune: 9,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { feedback: 10, mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // Bow
  {
    id: 'window-garden-one-plucked-string',
    name: 'One plucked string',
    category: 'plucked',
    description:
      'A single soft-plucked string with a wooden body, each note followed by one tape repeat.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { release: 1.5, brightness: 0.5, decay: 4, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 320, feedback: 0.1, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-light-bows',
    name: 'Light bows',
    category: 'string',
    description:
      'Strings bowed with almost no pressure, soft-edged and even, fading in over half a second.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.8, release: 2.5, brightness: 0.7, vibrato: 0.05, detune: 5, volume: -13 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.25 } }],
  },

  // Chamber strings
  {
    id: 'window-garden-still-trio',
    name: 'Still trio',
    category: 'string',
    description: 'Three players holding still notes without vibrato or bow noise, in a small room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.6, release: 2, air: 0.3, volume: -9 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } }],
  },
  {
    id: 'window-garden-violin-practice',
    name: 'Violin practice',
    category: 'string',
    description:
      'One lightly muted violin with a little vibrato, close and plain, in a small plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: {
        attack: 0.2,
        release: 0.8,
        bow: 0.35,
        air: 0.25,
        vibrato: 6,
        mute: 0.3,
        volume: -1.5,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } }],
    preview: 'line',
  },

  // Choir
  {
    id: 'window-garden-humming-upstairs',
    name: 'Humming upstairs',
    category: 'voice',
    description:
      'A few high voices on a closed oo with no vibrato, quick to speak, in a medium room.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        breath: 0.25,
        ensemble: 0.5,
        vibrato: 0,
        attack: 0.35,
        release: 1.5,
        tone: 6000,
        volume: -11.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.8, mix: 0.22 } }],
  },
  {
    id: 'window-garden-one-voice-no-words',
    name: 'One voice, no words',
    category: 'voice',
    description: 'A single voice singing oh with barely any vibrato, in a hall that whispers back.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.8,
        breath: 0.25,
        vibrato: 8,
        attack: 0.15,
        release: 0.8,
        tone: 5000,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.2 } }],
    preview: 'line',
  },

  // Chord harp
  {
    id: 'window-garden-plate-chimes',
    name: 'Plate chimes',
    category: 'plucked',
    description:
      'One clean electronic string per key, bright and bell-like, with a dark echo behind it.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { sustain: 3, tone: 0.85, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 400, feedback: 0.4, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-small-strum',
    name: 'Small strum',
    category: 'plucked',
    description:
      'A quick bright strum down two octaves of short strings, like a toy harp in a small room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 25, span: 1, sustain: 1.5, tone: 0.7, volume: -2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },

  // Clarinet
  {
    id: 'window-garden-clarinet-in-thirds',
    name: 'Clarinet in thirds',
    category: 'wind',
    description:
      'A warm clarinet with two quieter copies following it, a third above and a sixth below, in a small room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.5, breath: 0.35, attack: 0.08, release: 0.4, volume: 0 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { mix: 40 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-three-clarinets',
    name: 'Three clarinets',
    category: 'wind',
    description:
      'A small section of clarinets holding a hollow chord, widened a little in a small plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.45, attack: 0.2, release: 0.8, volume: -6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } },
    ],
    preview: 'chord',
  },

  // Drone
  {
    id: 'window-garden-steady-fifth',
    name: 'Steady fifth',
    category: 'drone',
    description:
      'A plain fifth of near-sine partials that hardly moves, a still floor for bright notes above.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.3,
        wave: 0,
        movement: 0.2,
        sub: 0.1,
        air: 0,
        cutoff: 3000,
        attack: 1,
        release: 3,
      },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.2 } }],
  },
  {
    id: 'window-garden-skylight-chord',
    name: 'Skylight chord',
    category: 'drone',
    description:
      'One low key opens into a just major chord of soft partials with a little air over it, hardly moving.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: {
        movement: 0.3,
        sub: 0.1,
        air: 0.2,
        cutoff: 8000,
        attack: 1.5,
        release: 4,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer' },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },

  // Dusk
  {
    id: 'window-garden-chorus-pulse-keys',
    name: 'Chorus pulse keys',
    category: 'keys',
    description:
      'A chorus polysynth played as keys: a soft moving pulse that speaks at once, with a short tape echo.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: {
        wave: 3,
        sub: 0.2,
        lowCut: 1,
        cutoff: 2600,
        envelope: 0.2,
        attack: 0.01,
        release: 0.6,
        chorus: 1,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 280, mix: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-daylight-pad',
    name: 'Daylight pad',
    category: 'pad',
    description:
      'The string pad of a chorus polysynth with the bass thinned out, quick to speak, in a medium room.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: {
        sub: 0.1,
        lowCut: 2,
        cutoff: 3500,
        attack: 0.2,
        release: 1.2,
        chorus: 2,
        volume: -7.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.22 } }],
  },

  // Ember
  {
    id: 'window-garden-sine-keys',
    name: 'Sine keys',
    category: 'keys',
    description:
      'A sine with a quiet octave below it, played as keys that fade while held, with a chorused echo.',
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: {
        subLevel: 0.25,
        ampAttack: 0.02,
        ampDecay: 2.5,
        ampSustain: 0.4,
        ampRelease: 1.2,
        voiceMode: 0,
        glide: 0,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 420, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-twelfth-bell',
    name: 'Twelfth bell',
    category: 'bell',
    description:
      'Two sines a twelfth apart struck as a bell and left to fade, with a plain repeat and a small plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { oscMix: 0.3, ampDecay: 2, ampRelease: 2, volume: 3 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Plain repeat', params: { mix: 0.22 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },

  // Felt piano
  {
    id: 'window-garden-upright-in-the-gallery',
    name: 'Upright in the gallery',
    category: 'keys',
    description:
      'A piano with only a thin felt, clear and close, its strings answering briefly in sympathy.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.2,
        hardness: 0.5,
        reverbMix: 0.12,
        outputDb: -15.5,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { mix: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-lobby-record',
    name: 'Lobby record',
    category: 'keys',
    description:
      'A felted piano played softly and pressed to a clean record: a faint surface and a slow, slight warp.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 0.8,
        thump: 0.4,
        grit: 0.1,
        reverbMix: 0.2,
        outputDb: -15.5,
      },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'New pressing',
        params: { surface: 0.2, warp: 0.1, crackle: 0.1, pops: 0.02 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
  },

  // Grain: written for whatever is loaded; the preview plays the built-in soft tone.
  {
    id: 'window-garden-held-moment',
    name: 'Held moment',
    category: 'pad',
    description:
      'One instant of whatever sound is loaded held still as a clear tone to play chords on, in a small room.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        position: 0.3,
        density: 8,
        attack: 0.3,
        release: 1.5,
        spread: 0.5,
        tone: 10000,
        volume: -15.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.25 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 8000, mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-slow-reading',
    name: 'Slow reading',
    category: 'texture',
    description:
      'The loaded sound read through slowly at its own pitch, grain by grain, open and nearly dry.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Slow stretch',
      params: {
        size: 200,
        density: 6,
        attack: 0.1,
        release: 1,
        spread: 0.4,
        tone: 12000,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.12 } }],
  },

  // Guitar
  {
    id: 'window-garden-clean-electric',
    name: 'Clean electric',
    category: 'plucked',
    description:
      'A clean electric guitar on the neck pickup, in a light chorus with a short spring behind it.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.4, sustain: 7, tone: 4200, strum: 12, warmth: 0.2, volume: 5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 1.5, mix: 0.15 } },
    ],
  },
  {
    id: 'window-garden-muted-counting',
    name: 'Muted counting',
    category: 'plucked',
    description:
      'Short palm-muted guitar notes with the click of the pick faded off, and a dark delay counting between them.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { hardness: 0.25, sustain: 3.5, tone: 4000, swell: 0.025, volume: 4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
  },

  // Handpan
  {
    id: 'window-garden-steel-tongue-drum',
    name: 'Steel tongue drum',
    category: 'bell',
    description:
      'A steel tongue drum touched lightly, round in tone with little shimmer, in a small room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 4, touch: 0.2, shimmer: 0.2, volume: -2.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'window-garden-damped-pan-taps',
    name: 'Damped pan taps',
    category: 'bell',
    description:
      'Short damped taps near the edge of a hand pan, with a quick tape echo and a small plate.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { decay: 1.5, touch: 0.45, damp: 0.6, volume: 1.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 260, mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },

  // Harp
  {
    id: 'window-garden-koto-by-the-pond',
    name: 'Koto by the pond',
    category: 'plucked',
    description:
      'A koto plucked with the edge of the pick softened a little, clear and dry in a small room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { pluck: 0.12, touch: 0.45, decay: 1.5, halo: 0.3, volume: 2.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-silk-strings',
    name: 'Silk strings',
    category: 'plucked',
    description:
      'Silk koto strings touched with the fingertip, each bending slightly as it settles, with a short halo.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { pluck: 0.3, decay: 2.2, halo: 0.5, bend: 40, volume: -0.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.25 } }],
  },

  // Horns
  {
    id: 'window-garden-radio-on-the-sill',
    name: 'Radio on the sill',
    category: 'wind',
    description:
      'A muted trumpet from a small transistor radio with clean reception, narrow and close, in a small room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.4, attack: 0.1, release: 1, vibrato: 0.05, volume: -7 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'window-garden-flugelhorns-indoors',
    name: 'Flugelhorns indoors',
    category: 'wind',
    description:
      'A few flugelhorns holding a soft, breathy chord without vibrato, in a short plain hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { breath: 0.35, section: 0.4, attack: 0.3, release: 1.5, vibrato: 0, volume: -9 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 1.8, mix: 0.2 } }],
    preview: 'chord',
  },

  // Ladder bass
  {
    id: 'window-garden-round-low-note',
    name: 'Round low note',
    category: 'keys',
    description:
      'A round, nearly pure bass note with nothing sharp in it, to sit under bright keys.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 200, glide: 0.05, volume: -19 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.1 } },
    ],
    preview: 'low',
  },
  {
    id: 'window-garden-soft-bass-pluck',
    name: 'Soft bass pluck',
    category: 'keys',
    description:
      'A soft plucked synthesizer bass that closes over a second or so, given a little weight by a transformer.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { cutoff: 400, emphasis: 0.3, contour: 0.4, decay: 1.5, drive: 0.2, volume: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
    preview: 'line',
  },

  // Reed organ
  {
    id: 'window-garden-flute-stops',
    name: 'Flute stops',
    category: 'organ',
    description:
      'The soft flute ranks of a small pipe organ, steady and plain, widened a little in a small room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.3, octave: 0.4, breath: 0.2, attack: 0.06, release: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-parlour-organ',
    name: 'Parlour organ',
    category: 'organ',
    description:
      'A flute stop and its octave under a gentle tremulant, through a slowly turning speaker in a small room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { octave: 0.3, breath: 0.3, tremulant: 0.4, volume: -13 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.05, mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },

  // Pedal steel
  {
    id: 'window-garden-steel-bar-bells',
    name: 'Steel bar bells',
    category: 'plucked',
    description:
      'Steel guitar notes picked with no swell or vibrato, bright as bells, with a chorused echo and a spring.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 5, vibrato: 0, pick: 0.7, tone: 5000, volume: -9 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 440, feedback: 0.35, mix: 0.25 },
      },
      {
        deviceId: 'spring-reverb',
        preset: 'Two spring tank',
        params: { decay: 2, drip: 0.25, mix: 0.18 },
      },
    ],
  },
  {
    id: 'window-garden-lap-steel-lightly',
    name: 'Lap steel, lightly',
    category: 'plucked',
    description:
      'A steel guitar with a short swell into each note and hardly any vibrato, in a small plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.25, sustain: 8, vibrato: 3, tone: 3600, volume: -6 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } }],
  },

  // Sampler: written for whatever is loaded; the preview plays the built-in soft tone.
  {
    id: 'window-garden-loaded-sound-as-keys',
    name: 'Loaded sound as keys',
    category: 'keys',
    description:
      'Whatever is loaded played once per key from start to end, in a light chorus and a small room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { release: 0.6, tone: 12000, velocity: 0.7, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-loaded-sound-looped',
    name: 'Loaded sound, looped',
    category: 'pad',
    description:
      'The loaded sound held on a steady crossfaded loop with almost no wobble, on clean tape in a small room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { crossfade: 120, attack: 0.12, release: 1, wobble: 0.1, volume: -17 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, hiss: 0.05 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // String machine
  {
    id: 'window-garden-high-string-line',
    name: 'High string line',
    category: 'string',
    description:
      'The top octave of a string ensemble alone, thin and bright, phasing slowly as it drifts, in a small room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.25, release: 1.5, tone: 6000, ensemble: 0.6, volume: -7 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { feedback: 0.3, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'window-garden-rounded-low-strings',
    name: 'Rounded low strings',
    category: 'string',
    description:
      'The low octave of a string ensemble, soft and rounded, on fresh tape in a small plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: {
        attack: 0.4,
        release: 1.5,
        low: 0.8,
        high: 0.1,
        tone: 1500,
        ensemble: 0.5,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'New tape', params: { tone: 0.5 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },

  // Tanpura
  {
    id: 'window-garden-four-plain-strings',
    name: 'Four plain strings',
    category: 'drone',
    description:
      'Four strings plucked in slow turn with no buzz at the bridge, and a few more that ring in sympathy.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 6, decay: 12, detune: 2, body: 0.5, volume: -4.5 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.25 } }],
  },
  {
    id: 'window-garden-soft-bridge-drone',
    name: 'Soft bridge drone',
    category: 'drone',
    description:
      'A drone lute with only a little buzz at its bridge, plucked every few seconds, close and dry.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.35, speed: 4.5, decay: 8, volume: -3.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
  },

  // Tape orchestra
  {
    id: 'window-garden-taped-flutes',
    name: 'Taped flutes',
    category: 'wind',
    description:
      'Flutes from a tape-replay keyboard in good repair, steady with a little hiss, in a small room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.15, hiss: 0.1, attack: 0.05, release: 0.5, vibrato: 0.4, volume: -4.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } }],
  },
  {
    id: 'window-garden-taped-reeds',
    name: 'Taped reeds',
    category: 'wind',
    description:
      'A reed section from clean tape strips, holding a chord with little wobble, in a small plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { age: 0.15, hiss: 0.1, attack: 0.1, release: 0.6, volume: -10 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } }],
    preview: 'chord',
  },

  // Thesis
  {
    id: 'window-garden-five-whistling-notes',
    name: 'Five whistling notes',
    category: 'texture',
    description:
      'One key becomes three whistling bands of noise from a five-note scale, breathing slowly.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: { resonance: 60, attack: 0.3, release: 1.5, breatheRate: 0.3 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 8, outputGain: -2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-whistled-line',
    name: 'Whistled line',
    category: 'wind',
    description:
      'Each note and its mirror as two narrow bands of noise, like whistling, with a soft dark echo.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { center: 64, resonance: 80, attack: 0.15, release: 1.2 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 8, outputGain: -3.5 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 420, mix: 0.25 } },
    ],
  },

  // West coast
  {
    id: 'window-garden-sine-mallet',
    name: 'Sine mallet',
    category: 'bell',
    description:
      'A near-sine struck through a gate that darkens as it fades, soft as a felt mallet, with a dark echo.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 1.8, colour: 0.5, chance: 0.05, volume: -1.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 300, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'window-garden-bamboo-knock',
    name: 'Bamboo knock',
    category: 'plucked',
    description:
      'A woody folded pluck that closes in a second or so, each note a little different, in a small room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.25, timbreEnv: 0.5, decay: 1.4, chance: 0.2, volume: -2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } }],
  },

  // Zither
  {
    id: 'window-garden-plucked-by-the-bridge',
    name: 'Plucked by the bridge',
    category: 'plucked',
    description:
      'One string of a koto-bodied zither plucked near the bridge with a fingertip, dry and bright, in a small room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { exciter: 0, decay: 3.5, brightness: 0.6, sympathy: 0.2, volume: -5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } }],
  },
  {
    id: 'window-garden-hammered-string',
    name: 'Hammered string',
    category: 'plucked',
    description:
      'A single string struck with a felt hammer, soft at the front, answered by itself backwards, in a small plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 4, brightness: 0.45, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 500, feedback: 0.2, mix: 0.25 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },
]
