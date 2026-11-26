// The presets as they are loaded.
//
// The presets of a style are in `presets/<style>.ts`, a script of their own that is loaded when a preset of that style
// is first drawn or asked for; the names and the sentences of all of them are in another (`preset-words.ts`), for a
// list or a search.

import { presetName, type VisualPreset, type VisualPresetWords } from './preset'
import { PRESET_SOURCES } from './preset-sources'

const NONE: readonly VisualPreset[] = []
/** How long a style whose presets could not be fetched is left alone before they are asked for again. */
const FETCH_AGAIN_MS = 5000

const loaded = new Map<string, readonly VisualPreset[]>()
const loading = new Map<string, Promise<readonly VisualPreset[]>>()
const failedAt = new Map<string, number>()

/** The presets of a style. A style this build does not have has none. */
export function loadVisualPresets(style: string): Promise<readonly VisualPreset[]> {
  const known = loaded.get(style)
  if (known) return Promise.resolve(known)
  const begun = loading.get(style)
  if (begun) return begun
  const load = Object.hasOwn(PRESET_SOURCES, style) ? PRESET_SOURCES[style] : undefined
  if (!load) {
    loaded.set(style, NONE)
    return Promise.resolve(NONE)
  }
  const promise = load().then(
    (presets) => {
      loaded.set(style, presets)
      loading.delete(style)
      return presets
    },
    (error: unknown) => {
      failedAt.set(style, Date.now())
      loading.delete(style)
      throw error
    },
  )
  loading.set(style, promise)
  return promise
}

/** The presets of a style where they are loaded; undefined while they are not, and they are then asked for. */
export function visualPresetsNow(style: string): readonly VisualPreset[] | undefined {
  const known = loaded.get(style)
  if (known) return known
  // Not fetched a moment ago, as on a line that dropped: asked for again in a while.
  if (Date.now() - (failedAt.get(style) ?? -Infinity) < FETCH_AGAIN_MS) return NONE
  loadVisualPresets(style).catch(() => undefined)
  return loaded.get(style)
}

/** One preset: undefined while the presets of its style are being loaded, null where this build does not have it. */
export function visualPresetNow(style: string, id: string): VisualPreset | null | undefined {
  const presets = visualPresetsNow(style)
  return presets && (presets.find((preset) => preset.id === id) ?? null)
}

/* eslint-disable no-restricted-syntax -- the words of every preset are loaded when a list or a search asks, not with the page */
let words: Promise<readonly VisualPresetWords[]> | null = null

/** The name and the sentence of every preset of every style. */
export function loadPresetWords(): Promise<readonly VisualPresetWords[]> {
  words ??= import('./preset-words').then(
    ({ PRESET_WORDS }) =>
      Object.entries(PRESET_WORDS).flatMap(([style, entries]) =>
        entries.map(([id, variation, what]) => ({
          style,
          id,
          name: presetName(id),
          what,
          variation,
        })),
      ),
    (error: unknown) => {
      words = null
      throw error
    },
  )
  return words
}
