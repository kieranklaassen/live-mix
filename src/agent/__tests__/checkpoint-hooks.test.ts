// Wrapping a session reads none of what its class works out on demand: a session whose hooks are
// its own arrow fields, and whose class has a getter that is not ready until the session has
// started, is wrapped as it was before its class's methods were taken along.
import { describe, expect, it } from 'vitest'

import { ScoreDocument } from '../../score/ScoreDocument'
import { VersionHistory } from '../../score/versions'
import { withVersionCheckpoints } from '../versionCheckpoints'
import { sessionScore } from './fixtures'

describe('withVersionCheckpoints on a class whose hooks are its own fields', () => {
  it('wraps it without running what its class computes on demand', () => {
    const document = new ScoreDocument(sessionScore())
    const versions = new VersionHistory(document, { autoCheckpoints: false })
    let read = 0
    class Conductor {
      private index = 0
      // Own, enumerable, bound by being arrows: the old spread carried these and they worked.
      advanceSection = (): number => {
        this.index += 1
        return this.index
      }
      isSpeaking = (): boolean => false
      /** Something the class works out on demand, and cannot before the session has started. */
      get playlist(): readonly string[] {
        read += 1
        throw new Error('the session has not started')
      }
    }
    const conductor = new Conductor()
    const session = withVersionCheckpoints(conductor, versions)
    expect(read).toBe(0)
    expect(session.advanceSection?.()).toBe(1)
    expect(session.isSpeaking?.()).toBe(false)
  })
})
