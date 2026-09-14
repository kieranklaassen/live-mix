import '@kieranklaassen/live-mix/react/styles.css'
import { type Engine } from '@kieranklaassen/live-mix'
import { LiveMixProvider, MixerView, TransportBar } from '@kieranklaassen/live-mix/react'

// The hooks subscribe to the engine's change events; the kit is themed
// through --lm-* CSS variables. Pass `engine={null}` until the start gesture.
export function Studio({ engine }: { engine: Engine | null }) {
  return (
    <LiveMixProvider engine={engine}>
      <TransportBar />
      <MixerView returns={engine?.returnTracks} inputs={engine?.liveInputs} />
    </LiveMixProvider>
  )
}
