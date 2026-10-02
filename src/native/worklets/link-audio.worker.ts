// The Link Audio pump worker: `LinkAudioPump` behind message ports. Bundled
// to a single self-contained classic script (dist/worklets/link-audio.js) so
// a host page can start it from a URL without a bundler of its own.

import { LinkAudioPump, type LinkAudioSocket } from '../LinkAudioPump'
import {
  type LinkAudioPumpEvent,
  type LinkAudioPumpMessage,
  type LinkTapBlock,
} from '../link-audio-protocol'

interface WorkerScope {
  onmessage: ((event: MessageEvent<LinkAudioPumpMessage>) => void) | null
  postMessage(message: LinkAudioPumpEvent): void
  close(): void
}

const scope = globalThis as unknown as WorkerScope
let pump: LinkAudioPump | null = null
let statsTimer: ReturnType<typeof setInterval> | null = null

scope.onmessage = (event) => {
  const message = event.data
  switch (message.type) {
    case 'start': {
      if (pump) return
      const started = new LinkAudioPump({
        socket: new WebSocket(message.url) as unknown as LinkAudioSocket,
        sampleRate: message.sampleRate,
        onOpen: () => scope.postMessage({ type: 'open' }),
        onClose: (reason) => {
          if (statsTimer !== null) clearInterval(statsTimer)
          scope.postMessage({ type: 'close', reason })
        },
      })
      pump = started
      // Blocks come straight from the tap, past the main thread.
      message.port.onmessage = (block: MessageEvent<LinkTapBlock>) => started.send(block.data)
      const interval = message.statsIntervalMs ?? 1000
      if (interval > 0) {
        statsTimer = setInterval(() => {
          scope.postMessage({ type: 'stats', stats: started.takeStats() })
        }, interval)
      }
      break
    }
    case 'clock':
      pump?.setClock({ contextTime: message.contextTime, hostMicros: message.hostMicros })
      break
    case 'stop':
      pump?.stop()
      scope.close()
      break
  }
}
