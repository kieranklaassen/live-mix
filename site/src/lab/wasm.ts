// A lab module's exports, as site/labs/lab.h declares them. Raw WebAssembly, no imports.

export interface LabExports {
  memory: WebAssembly.Memory
  _initialize?: () => void
  lab_init(): void
  lab_sample_rate(): number
  lab_max_frames(): number
  lab_input(channel: number): number
  lab_set(control: number, value: number): void
  lab_run(frames: number): void
  lab_control_count(): number
  lab_control_id(i: number): number
  lab_control_name(i: number): number
  lab_control_unit(i: number): number
  lab_control_choices(i: number): number
  lab_control_min(i: number): number
  lab_control_max(i: number): number
  lab_control_default(i: number): number
  lab_control_scale(i: number): number
  lab_control_value(i: number): number
  lab_tap_count(): number
  lab_tap_id(i: number): number
  lab_tap_name(i: number): number
  lab_tap_unit(i: number): number
  lab_tap_kind(i: number): number
  lab_tap_origin(i: number): number
  lab_tap_channels(i: number): number
  lab_tap_data(i: number): number
  lab_tap_length(i: number): number
  lab_tap_x0(i: number): number
  lab_tap_x1(i: number): number
  lab_tap_columns(i: number): number
  lab_tap_scale(i: number): number
  lab_check_count(): number
  lab_check_id(i: number): number
  lab_check_name(i: number): number
  lab_check_unit(i: number): number
  lab_check_value(i: number): number
  lab_spectrum(tap: number, channel: number, start: number, count: number): number
  lab_spectrum_bins(): number
  /** Only in a lab that takes a second signal (LAB_AUX in site/labs/lab.h). */
  lab_aux?(channel: number): number
  lab_aux_set?(frames: number): void
}

/** Instantiate a lab from its bytes: the same call in Node (tests) and in the page's worker. */
export async function instantiateLab(bytes: BufferSource): Promise<LabExports> {
  const { instance } = await WebAssembly.instantiate(bytes, {})
  const exports = instance.exports as unknown as LabExports
  // The module is a reactor: its file-level objects (controls, taps) are built here.
  exports._initialize?.()
  exports.lab_init()
  return exports
}

const decoder = new TextDecoder()

/** A zero-ended string in the module's memory. */
export function readString(memory: WebAssembly.Memory, pointer: number): string {
  if (!pointer) return ''
  const bytes = new Uint8Array(memory.buffer, pointer)
  let end = 0
  while (bytes[end] !== 0) end += 1
  return decoder.decode(bytes.subarray(0, end))
}
