// The port one run of scripts/lesson.sh serves its lesson's build at: the run's own, and free.
// A lesson once had one fixed port, so two runs of one lesson (one of them in another copy of
// the repository) met at it: the second was refused, or tested the first one's pages.
//
//   node scripts/free-port.mjs <lesson> <process id>     prints a port that nobody holds
//
// The port is worked out from the lesson's id and the id of the process that asks, so two runs
// start apart, and is then tried: one that is held is passed over for the next.
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Where the ports come from: above the whole site's 4321 and the ports the lessons had by
 * their numbers, below the ports a system hands out by itself.
 */
export const PORTS = { first: 10_000, count: 20_000 }

/** Where a run of a lesson starts looking: the same for the same lesson and process. */
export function portFor(lesson, processId) {
  let spread = 0
  for (const letter of lesson) spread = (spread * 31 + letter.codePointAt(0)) % PORTS.count
  return PORTS.first + ((spread + Math.abs(Math.trunc(processId) || 0)) % PORTS.count)
}

/** Whether nothing listens at a port, found by listening there for a moment. */
const isFree = (port) =>
  new Promise((resolve) => {
    const probe = net.createServer()
    probe.once('error', () => resolve(false))
    probe.listen(port, () => probe.close(() => resolve(true)))
  })

/** The first port from `from` on, round the range, that nobody holds. */
export async function freePort(from) {
  for (let tried = 0; tried < PORTS.count; tried += 1) {
    const port = PORTS.first + ((from - PORTS.first + tried) % PORTS.count)
    if (await isFree(port)) return port
  }
  throw new Error(`No port from ${PORTS.first} to ${PORTS.first + PORTS.count - 1} is free.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [lesson = '', processId = process.pid] = process.argv.slice(2)
  console.log(await freePort(portFor(lesson, Number(processId))))
}
