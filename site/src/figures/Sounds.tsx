// The row of sounds under a lesson's title: the lesson's sources as a group of choices, bound to
// the same source as the play bar's picker. A file of the reader's own is picked in the bar, and
// while it plays none of these holds.

import { labStore, useLab } from '../lab/page.ts'
import type { SourceInfo } from '../lab/sources.ts'
import Choices from './Choices.tsx'

export default function Sounds({
  sources,
  labelledBy,
}: {
  sources: SourceInfo[]
  labelledBy: string
}) {
  const state = useLab()
  return (
    <Choices
      className="sounds-choices"
      labelledBy={labelledBy}
      choices={sources.map((source) => ({
        value: source.id,
        name: source.name,
        about: source.about,
      }))}
      value={state.source || sources[0]?.id}
      disabled={state.status === 'failed'}
      onChoose={(id) => labStore().setSource(String(id))}
    />
  )
}
