// The pump worker: `BridgePump` behind a message port. Bundled to a single
// self-contained classic script (dist/worklets/native-pump.js) so a host page
// can start it from a URL without a bundler of its own.

import { BridgePump, type PumpSocket } from '../BridgePump'
import { type PumpEvent, type PumpMessage } from '../bridge-protocol'

interface WorkerScope {
  onmessage: ((event: MessageEvent<PumpMessage>) => void) | null
  postMessage(message: PumpEvent): void
  close(): void
}

const scope = globalThis as unknown as WorkerScope
let pump: BridgePump | null = null
let statsTimer: ReturnType<typeof setInterval> | null = null

scope.onmessage = (event) => {
  const message = event.data
  switch (message.type) {
    case 'start': {
      if (pump) return
      const started = new BridgePump({
        memory: message.memory,
        socket: new WebSocket(message.url) as unknown as PumpSocket,
        onOpen: () => scope.postMessage({ type: 'open' }),
        onClose: (reason) => {
          if (statsTimer !== null) clearInterval(statsTimer)
          scope.postMessage({ type: 'close', reason })
        },
      })
      pump = started
      const interval = message.statsIntervalMs ?? 1000
      if (interval > 0) {
        statsTimer = setInterval(() => {
          scope.postMessage({ type: 'stats', stats: started.takeStats() })
        }, interval)
      }
      void started.run()
      break
    }
    case 'midi':
      pump?.midi(message.bytes)
      break
    case 'stop':
      pump?.stop()
      scope.close()
      break
  }
}
