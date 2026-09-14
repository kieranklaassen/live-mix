import {
  ScoreDocument,
  createEngine,
  loadScore,
  renderScore,
  wavBlob,
} from '@kieranklaassen/live-mix'

const engine = createEngine({ context: new AudioContext() })

// A score is JSON: tracks, clips, sends, devices, lanes, scenes — everything
// except live input. The live graph follows the document from here on.
const json = await (await fetch('/scores/night-drive.json')).text()
const doc = ScoreDocument.parse(json, { devices: engine.devices })
loadScore(engine, doc)
engine.transport.start()

// Every edit is an operation: validated, logged with its author, undoable.
doc.apply(
  { type: 'strip.set', owner: 'pads', param: 'level', value: 0.6 },
  { author: { id: 'ui', kind: 'human' }, label: 'pads fader' },
)
doc.apply({
  type: 'clip.add',
  track: 'drums',
  clip: {
    id: 'fill-1',
    sourceId: 'fill',
    startSec: 30,
    offsetSec: 0,
    durationSec: 2,
    fadeInSec: 0.01,
    fadeOutSec: 0.05,
    fadeCurve: 'linear',
    gainDb: 0,
  },
})
doc.undo() // one step per gesture; the graph follows
doc.redo()

// The same document renders offline, identical to live playback, in a browser or in Node.
const bounce = await renderScore(doc.score, { durationSec: 120 })
Object.assign(document.createElement('a'), {
  href: URL.createObjectURL(wavBlob(bounce.audio, { bitDepth: 24 })),
  download: 'night-drive.wav',
}).click()
