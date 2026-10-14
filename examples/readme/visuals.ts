import { createEngine } from '@kieranklaassen/live-mix'
import {
  type FollowedStroke,
  VisualDesk,
  addVisual,
  createEar,
  emptyVisualSet,
  showVisuals,
} from '@kieranklaassen/live-mix/visuals'

// A piece's visuals are plain data, stored with the piece: here a globe of
// dots for the whole of it, and trails over what it draws.
let set = addVisual(emptyVisualSet(), 'dot-globe').set
set = addVisual(set, 'trails').set

// The sounds of the piece as the picture follows them: when each sounds and
// how loud, of which kind, in which colour, and where it sits in the room.
const strokes: FollowedStroke[] = [
  {
    id: 'pad-1',
    slot: 'pad',
    startSec: 0,
    durationSec: 60,
    fadeInSec: 2,
    fadeOutSec: 4,
    depth: 0.5,
    thickness: 0.2,
    gain: 0.8,
    colour: [0.9, 0.6, 0.3],
  },
]

export function showPiece(canvas: HTMLCanvasElement) {
  const engine = createEngine({ context: new AudioContext() })
  // A tap of its own on the master: the level and sixteen bands of the mix.
  const ear = createEar(engine.context, engine.master)

  // Once a frame the desk reads the piece and the music as they are now, and
  // answers with a frame: plain data any number of canvases can paint.
  const desk = new VisualDesk(() => ({
    set,
    strokes,
    playheadSec: engine.transport.position().positionSec,
    pieceSec: 60,
    beatSec: 0.5,
    playing: engine.transport.state === 'playing',
    heard: ear.read(),
    energy: 0.6,
    space: 0.5,
    tone: 0.5,
    input: 0,
  }))

  // Painted for as long as it is shown; null where there is no WebGL 2.
  return showVisuals(canvas, (now) => desk.frame(now))
}
