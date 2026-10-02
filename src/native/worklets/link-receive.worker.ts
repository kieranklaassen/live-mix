// The Link Audio intake worker: `LinkAudioIntake` behind message ports.
// Bundled to a single self-contained classic script
// (dist/worklets/link-receive.js) so a host page can start it from a URL
// without a bundler of its own.

import { LinkAudioIntake, type LinkIntakeSocket } from '../LinkAudioIntake'
import type { LinkAudioClock } from '../link-audio-protocol'
import type { LinkIntakeEvent, LinkIntakeMessage } from '../link-receive-protocol'

interface WorkerScope {
  onmessage: ((event: MessageEvent<LinkIntakeMessage>) => void) | null
  postMessage(message: LinkIntakeEvent): void
  close(): void
}

const scope = globalThis as unknown as WorkerScope
let intake: LinkAudioIntake | null = null
// The clock is told before the connection is asked for; it waits here.
let clock: LinkAudioClock | null = null

scope.onmessage = (event) => {
  const message = event.data
  switch (message.type) {
    case 'start': {
      if (intake) return
      const playout = message.port
      intake = new LinkAudioIntake({
        socket: new WebSocket(message.url) as unknown as LinkIntakeSocket,
        // Blocks go straight to the playout, past the main thread.
        deliver: (block) => playout.postMessage(block, [block.samples.buffer]),
        onOpen: () => scope.postMessage({ type: 'open' }),
        onClose: (reason) => scope.postMessage({ type: 'close', reason }),
      })
      if (clock) intake.setClock(clock)
      break
    }
    case 'clock':
      clock = { contextTime: message.contextTime, hostMicros: message.hostMicros }
      intake?.setClock(clock)
      break
    case 'stop':
      intake?.stop()
      scope.close()
      break
  }
}
