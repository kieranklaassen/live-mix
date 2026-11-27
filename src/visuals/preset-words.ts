// What every preset is called and what is seen in it: its id, its variation and its sentence, under its style.
//
// Written by `scripts/gen-visual-presets.mjs`, from the files of `presets/`.

export const PRESET_WORDS: Readonly<
  Record<string, readonly (readonly [id: string, variation: 0 | 1, what: string])[]>
> = {}
