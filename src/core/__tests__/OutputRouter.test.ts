import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { OutputRouter, isIOSWebKit } from '../output/OutputRouter'

interface FakeAudioElement {
  autoplay: boolean
  muted: boolean
  srcObject: unknown
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
}

function fakeAudioElement(): FakeAudioElement {
  return {
    autoplay: false,
    muted: true,
    srcObject: null,
    play: vi.fn(async () => {}),
    pause: vi.fn(),
  }
}

interface FakeMediaSession {
  metadata: unknown
  playbackState: string
  setActionHandler: ReturnType<typeof vi.fn>
  handlers: Record<string, () => void>
}

function fakeMediaSession(): FakeMediaSession {
  const handlers: Record<string, () => void> = {}
  return {
    metadata: null,
    playbackState: 'none',
    handlers,
    setActionHandler: vi.fn((name: string, handler: (() => void) | null) => {
      if (handler) handlers[name] = handler
    }),
  }
}

describe('OutputRouter', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'MediaMetadata',
      class {
        title: string
        artist: string
        constructor(init: { title?: string; artist?: string } = {}) {
          this.title = init.title ?? ''
          this.artist = init.artist ?? ''
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('direct mode terminates at ctx.destination and creates nothing', () => {
    const ctx = createMockContext()
    const createAudioElement = vi.fn()
    const router = new OutputRouter(asAudioContext(ctx), { createAudioElement, mediaSession: null })
    expect(router.mode).toBe('direct')
    expect(router.output).toBe(ctx.destination)
    expect(router.element).toBeNull()
    expect(ctx.streamDestinations).toHaveLength(0)
    expect(createAudioElement).not.toHaveBeenCalled()
    router.activate()
  })

  it('element mode routes into an unmuted media element fed by a stream destination', () => {
    const ctx = createMockContext()
    const element = fakeAudioElement()
    const router = new OutputRouter(asAudioContext(ctx), {
      mode: 'element',
      createAudioElement: () => element as unknown as HTMLAudioElement,
      mediaSession: null,
    })
    expect(ctx.streamDestinations).toHaveLength(1)
    expect(router.output).toBe(ctx.streamDestinations[0])
    expect(element.srcObject).toBe(ctx.streamDestinations[0].stream)
    expect(element.muted).toBe(false)
    expect(element.autoplay).toBe(true)

    router.activate()
    router.activate()
    expect(element.play).toHaveBeenCalledTimes(1)
  })

  it('sets media-session metadata and mute-based pause/play handlers', () => {
    const ctx = createMockContext()
    const element = fakeAudioElement()
    const session = fakeMediaSession()
    const router = new OutputRouter(asAudioContext(ctx), {
      mode: 'element',
      mediaTitle: 'grounding',
      mediaArtist: 'Adem',
      createAudioElement: () => element as unknown as HTMLAudioElement,
      mediaSession: session as unknown as MediaSession,
    })
    router.activate()

    expect(session.metadata).toMatchObject({ title: 'grounding', artist: 'Adem' })
    expect(session.playbackState).toBe('playing')
    session.handlers.pause()
    expect(element.muted).toBe(true)
    expect(session.playbackState).toBe('paused')
    session.handlers.play()
    expect(element.muted).toBe(false)
    expect(session.playbackState).toBe('playing')
  })

  it('omits the artist when none is configured and survives media-session errors', () => {
    const ctx = createMockContext()
    const element = fakeAudioElement()
    const session = fakeMediaSession()
    session.setActionHandler = vi.fn(() => {
      throw new Error('unsupported')
    })
    const router = new OutputRouter(asAudioContext(ctx), {
      mode: 'element',
      mediaTitle: 'solo',
      createAudioElement: () => element as unknown as HTMLAudioElement,
      mediaSession: session as unknown as MediaSession,
    })
    expect(() => router.activate()).not.toThrow()
    expect(session.metadata).toMatchObject({ title: 'solo', artist: '' })
  })

  it('dispose pauses and detaches the element', () => {
    const ctx = createMockContext()
    const element = fakeAudioElement()
    const router = new OutputRouter(asAudioContext(ctx), {
      mode: 'element',
      createAudioElement: () => element as unknown as HTMLAudioElement,
      mediaSession: null,
    })
    router.dispose()
    expect(element.pause).toHaveBeenCalled()
    expect(element.srcObject).toBeNull()
    expect(ctx.streamDestinations[0].disconnectCalls.count).toBe(1)
  })
})

describe('isIOSWebKit', () => {
  function win(overrides: {
    userAgent?: string
    maxTouchPoints?: number
    chrome?: unknown
  }): Window {
    return {
      navigator: {
        userAgent: overrides.userAgent ?? '',
        maxTouchPoints: overrides.maxTouchPoints ?? 0,
      },
      ...(overrides.chrome !== undefined ? { chrome: overrides.chrome } : {}),
    } as unknown as Window
  }

  it('detects iPhone and iPad Safari', () => {
    expect(
      isIOSWebKit(
        win({
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
          maxTouchPoints: 5,
        }),
      ),
    ).toBe(true)
    expect(
      isIOSWebKit(
        win({
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
          maxTouchPoints: 5,
        }),
      ),
    ).toBe(true)
  })

  it('rejects desktop Safari, Chrome-likes, non-Apple touch devices and no window', () => {
    expect(
      isIOSWebKit(
        win({
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
          maxTouchPoints: 0,
        }),
      ),
    ).toBe(false)
    expect(
      isIOSWebKit(
        win({
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
          maxTouchPoints: 5,
          chrome: {},
        }),
      ),
    ).toBe(false)
    expect(
      isIOSWebKit(
        win({
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
          maxTouchPoints: 5,
          chrome: {},
        }),
      ),
    ).toBe(false)
    expect(isIOSWebKit()).toBe(false)
  })
})
