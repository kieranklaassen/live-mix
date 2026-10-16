/**
 * `@kieranklaassen/live-mix/visuals` — pictures that follow the music: forty-one
 * shader styles, four bends, sixteen palettes and film grain, drawn from what a
 * piece is doing at that moment (docs/visuals.md).
 *
 *   const ear = createEar(context, engine.master)                  // or tapOf(anyNode)
 *   const desk = new VisualDesk(() => ({ set, playheadSec, playing, strokes, heard: ear.read(), ... }))
 *   const stop = showVisuals(canvas, (now) => desk.frame(now))     // any number of canvases
 *   sendVisuals('picture', (now) => desk.frame(now))               // and in another window:
 *   showVisuals(canvas, receiveVisuals('picture').frameAt)
 *   const scope = new SyncScope()                                  // how far the picture is behind the sound:
 *   hearTrace(context, engine.master, clock).read((at, level) => scope.put('sound', at, level))
 *   scope.put('picture', clock(), lightOf(canvas)); scope.behind('picture', 'sound', clock())
 *   new VisualDesk(() => ({ ..., perform: { rides, ladder, overSec } }))  // the picture follows a performance
 *
 * Separate entry on purpose: it imports nothing from the rest of the library
 * but the JSON types, so a page that only draws loads none of the audio
 * engine, and one that only keeps a piece's visuals (`model.ts`) draws
 * nothing. The model, the signals and the frame are plain functions of their
 * arguments; the ear, the rig, the stage and `showVisuals` need a browser, and
 * a style's shader is loaded the first time it is drawn.
 * `src/visuals/__tests__/boundary.test.ts` holds it to that.
 *
 * @module live-mix/visuals
 */

export {
  DEFAULT_GRAIN,
  PEDAL_FIRST_SIZE,
  PEDAL_LEAST_SIZE,
  PEDAL_MOST_SIZE,
  PEDAL_MOST_TURN,
  STYLE_KNOBS,
  VISUALS_META,
  VISUAL_BENDS,
  VISUAL_FIRST_BEATS,
  VISUAL_KINDS,
  VISUAL_LANES,
  VISUAL_MAX,
  VISUAL_PEDALS_MAX,
  VISUAL_SHORTEST_BEATS,
  VISUAL_SOURCES,
  addVisual,
  carryPedals,
  carryVisualLinks,
  createVisualId,
  drawOrder,
  emptyVisualSet,
  firstKnobs,
  freeLane,
  freePedalSpot,
  isEmptyVisualSet,
  isVisualKind,
  isVisualSource,
  knobsOf,
  layPedal,
  liftPedal,
  liftPedals,
  linkVisual,
  movePedal,
  paints,
  pedalOf,
  placeVisual,
  removeVisual,
  sameVisualSet,
  setVisualGrain,
  setVisualKind,
  setVisualKnob,
  setVisualPalette,
  setVisualVariation,
  visualBend,
  visualById,
  visualByNumber,
  visualKindName,
  visualLabel,
  visualNumber,
  visualsFromJson,
  visualsToJson,
  withoutLostPedals,
  withoutLostVisuals,
  type LinkedStroke,
  type PedalEdit,
  type PedalPlace,
  type Visual,
  type VisualBend,
  type VisualEdit,
  type VisualKnob,
  type VisualKnobSpec,
  type VisualPedal,
  type VisualPlace,
  type VisualSet,
  type VisualSource,
} from './model'
export {
  VISUAL_GROUPS,
  VISUAL_STYLES,
  visualStyle,
  type VisualGroupId,
  type VisualStyle,
} from './styles'
export {
  DEFAULT_PALETTE,
  VISUAL_PALETTES,
  isVisualPalette,
  visualPalette,
  type VisualPalette,
} from './palettes'
export {
  KIND_SLOTS,
  MAP_H,
  MAP_W,
  SPECTRUM_BANDS,
  frameOf,
  knobNow,
  paintsWholePiece,
  presenceOf,
  quietSignals,
  sampleFrame,
  sourceNow,
  type KindSlot,
  type VisualFrame,
  type VisualLayer,
  type VisualSignals,
} from './frame'
export {
  VisualFollower,
  strokeShape,
  type FollowInput,
  type Followed,
  type FollowedStroke,
  type Heard,
  type Rgb,
} from './follow'
export {
  followedStrokes,
  hitsOfPass,
  rgbOfHex,
  slotOfKind,
  type PieceRead,
  type PieceStroke,
  type StrokePass,
} from './feed'
export { VisualDesk, type DeskReading } from './desk'
export {
  DIAL_REST_SPAN,
  fullnessOf,
  performMoves,
  staying,
  type PerformMove,
  type PerformNow,
  type PerformReading,
  type VisualFilter,
} from './perform'
export {
  EAR_KEEPS_SEC,
  bandEdges,
  bandsOf,
  createEar,
  hearTrace,
  levelOf,
  outputLatencySec,
  tapOf,
  type HeardTrace,
  type TappedMaster,
  type VisualEar,
} from './ear'
export { SYNC_SURE, SyncScope, type SyncReading, type SyncScopeOptions } from './sync'
export {
  VISUALS_NOT_DRAWN_NOTE,
  visualRig,
  visualsMayDraw,
  visualsReady,
  watchVisuals,
  type DrawnAt,
  type StyleDraw,
  type VisualRig,
} from './rig'
export { WIDEST_DRAWN, createStage, type Stage } from './stage'
export { lightOf, showVisuals, type ShowVisualsOptions } from './picture'
export {
  receiveVisuals,
  sendVisuals,
  type SendVisualsOptions,
  type VisualLine,
  type VisualLineOptions,
  type VisualReceiver,
  type VisualSender,
} from './line'
