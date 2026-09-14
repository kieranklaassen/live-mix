// The one-call entry point: make an engine follow a score or a document.
// Kept out of `Engine` so consumers that never load a score do not carry the
// renderer, the operations and the schema in their bundle; one renderer per
// engine is tracked here instead.

import { type Engine } from '../core/Engine'
import { type Score } from './schema'
import { ScoreDocument } from './ScoreDocument'
import { ScoreRenderer, type ScoreRendererOptions } from './ScoreRenderer'

const renderers = new WeakMap<Engine, ScoreRenderer>()

/**
 * Render a score onto `engine`, or follow a `ScoreDocument`'s changes. One
 * renderer per engine: loading again disposes the previous one (its tracks,
 * devices and bindings leave the graph). Live-input tracks declared in the
 * score are created but their audio is the app's:
 * `scoreRendererOf(engine).liveInput(id).attach(stream)`.
 */
export function loadScore(
  engine: Engine,
  source: Score | ScoreDocument,
  options: ScoreRendererOptions = {},
): ScoreRenderer {
  renderers.get(engine)?.dispose()
  const renderer = new ScoreRenderer(engine, options)
  renderers.set(engine, renderer)
  if (source instanceof ScoreDocument) renderer.attach(source)
  else renderer.render(source).catch((error: unknown) => renderer.handleError(error))
  return renderer
}

/** The renderer `loadScore` installed on this engine, if any (and not disposed since). */
export function scoreRendererOf(engine: Engine): ScoreRenderer | undefined {
  return renderers.get(engine)
}

/** Forget the engine's renderer after disposing it. */
export function unloadScore(engine: Engine): void {
  renderers.get(engine)?.dispose()
  renderers.delete(engine)
}
