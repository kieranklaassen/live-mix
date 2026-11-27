// Where each style's presets are, each loaded the first time one is drawn or asked for.
//
// Written by `scripts/gen-visual-presets.mjs`, from the files of `presets/`.

import type { VisualPreset } from './preset'

export const PRESET_SOURCES: Readonly<Record<string, () => Promise<readonly VisualPreset[]>>> = {}
