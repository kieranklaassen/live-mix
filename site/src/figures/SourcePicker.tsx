// What goes into the lab: a loop the engine's own instruments play, a test signal from the kit's
// oscillators, or a file of the reader's own, decoded here and never sent anywhere.

import { useRef } from 'react'
import { labStore, takeOwnFile, useLab } from '../lab/page.ts'
import { OWN_FILE, type SourceInfo } from '../lab/sources.ts'

const PICK_FILE = '@pick-file'

export default function SourcePicker({ sources }: { sources: SourceInfo[] }) {
  const state = useLab()
  const input = useRef<HTMLInputElement | null>(null)
  const current = state.source || sources[0]?.id
  const about =
    current === OWN_FILE ? state.file?.note : sources.find((one) => one.id === current)?.about
  return (
    <div className="playbar-field playbar-source">
      <label htmlFor="lab-source">Source</label>
      <select
        id="lab-source"
        value={current}
        title={about}
        onChange={(event) => {
          if (event.target.value === PICK_FILE) input.current?.click()
          else labStore().setSource(event.target.value)
        }}
      >
        {sources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.name}
          </option>
        ))}
        {state.file && (
          <option value={OWN_FILE}>
            {state.file.name} ({state.file.note})
          </option>
        )}
        <option value={PICK_FILE}>Your own file…</option>
      </select>
      <input
        ref={input}
        type="file"
        accept="audio/*"
        hidden
        aria-label="A sound file of your own"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void takeOwnFile(file)
          event.target.value = ''
        }}
      />
      {state.sourceMessage && (
        <span className="playbar-message" role="status">
          {state.sourceMessage}
        </span>
      )}
    </div>
  )
}
