// The offline half of "one score, two renderers": a compiled script bounced
// through `renderScore` and encoded as WAV — tuin's "one MP3" outcome minus
// the MP3 encoding, which the browser has no native encoder for (see
// docs/agent-authored-scores.md for MediaRecorder and external encoders).

import { encodeWav, type WavEncodeOptions } from '../../core/render/encode'
import { type RenderResult } from '../../core/render/OfflineRenderer'
import { renderScore, type RenderScoreOptions } from '../../score/renderScore'
import { type AgentTrack } from '../types'
import { compileScriptDetailed, type CompiledScript, type CompileScriptOptions } from './compile'
import { type SessionScript } from './script'

export type RenderScriptOptions = Omit<RenderScoreOptions, 'durationSec'> & {
  /** Render length; default the compiled script's `durationSec`. */
  durationSec?: number
  wav?: WavEncodeOptions
}

export interface RenderedScript {
  compiled: CompiledScript
  result: RenderResult
  /** RIFF/WAVE bytes of the master. */
  wav: ArrayBuffer
}

/** Compile, bounce the master offline and encode it as WAV. */
export async function renderScriptToWav(
  script: SessionScript,
  library: readonly AgentTrack[],
  options: { compile?: CompileScriptOptions; render?: RenderScriptOptions } = {},
): Promise<RenderedScript> {
  const compiled = compileScriptDetailed(script, library, options.compile)
  const { wav: wavOptions, durationSec, ...render } = options.render ?? {}
  const result = await renderScore(compiled.score, {
    ...render,
    durationSec: durationSec ?? compiled.durationSec,
  })
  return { compiled, result, wav: encodeWav(result.audio, wavOptions) }
}
