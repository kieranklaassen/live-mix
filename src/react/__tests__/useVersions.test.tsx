// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Arbiter } from '../../score/Arbiter'
import { findStripHost } from '../../score/schema'
import { ScoreDocument } from '../../score/ScoreDocument'
import { VersionHistory } from '../../score/versions'
import { demoScore } from '../../score/__tests__/fixtures'
import { VersionList } from '../components/VersionList'
import { LiveMixProvider } from '../hooks/useEngine'
import { useVersions } from '../hooks/useVersions'

afterEach(cleanup)

function rig() {
  const clock = { ms: 60_000 }
  const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
  let counter = 0
  const history = new VersionHistory(document, { now: () => clock.ms, id: () => `v${++counter}` })
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(LiveMixProvider, { engine: null, versions: history }, children)
  const level = (): number => findStripHost(document.score, 'kick')?.strip.level ?? NaN
  return { document, history, clock, wrapper, level }
}

describe('useVersions', () => {
  it('lists versions and follows saves, restores and removals', () => {
    const { history, document, level } = rig()
    const { result } = renderHook(() => useVersions(history))
    expect(result.current.versions.map((version) => version.label)).toEqual(['Session start'])
    expect(result.current.latest?.id).toBe('v1')

    act(() => {
      document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 })
      result.current.save('half')
    })
    expect(result.current.versions).toHaveLength(2)
    expect(result.current.latest).toMatchObject({ id: 'v2', label: 'half', base: 'delta' })
    expect(result.current.bytes).toBe(history.bytes)

    act(() => {
      expect(result.current.restore('v1').outcome).toBe('applied')
    })
    expect(level()).toBe(0.8)
    expect(result.current.diff('v1', 'v2').fields).toHaveLength(1)
    act(() => {
      result.current.remove('v1')
    })
    expect(result.current.versions.map((version) => version.id)).toEqual(['v2'])
    expect(result.current.scoreOf('v2')).toBeDefined()
  })

  it('lists the history it is given now, not the one before it at the same revision', () => {
    const first = rig()
    const second = rig()
    first.history.save('one')
    second.history.save('other')
    expect(first.history.revision).toBe(second.history.revision)
    const { result, rerender } = renderHook(({ history }) => useVersions(history), {
      initialProps: { history: first.history },
    })
    expect(result.current.latest?.label).toBe('one')
    rerender({ history: second.history })
    expect(result.current.history).toBe(second.history)
    expect(result.current.versions.map((version) => version.label)).toEqual([
      'Session start',
      'other',
    ])
  })

  it('resolves the provided history and throws without one', () => {
    const { history, wrapper } = rig()
    const { result } = renderHook(() => useVersions(), { wrapper })
    expect(result.current.history).toBe(history)
    expect(() => renderHook(() => useVersions())).toThrow(/needs a VersionHistory/)
  })
})

describe('VersionList', () => {
  it('saves from the form, lists newest first, restores and removes', () => {
    const { document, history, wrapper, level } = rig()
    const onRestore = vi.fn()
    render(<VersionList data-testid="vl" onRestore={onRestore} formatTime={(ms) => `${ms}`} />, {
      wrapper,
    })
    expect(screen.getByRole('region', { name: 'Versions' })).toBeInTheDocument()
    expect(screen.getByText('Session start')).toBeInTheDocument()

    act(() => {
      document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 })
    })
    fireEvent.change(screen.getByLabelText('Version name'), { target: { value: 'half' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(history.versions.map((version) => version.label)).toEqual(['Session start', 'half'])
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('half')
    expect(items[0]).toHaveTextContent('local · 60000 ·')
    expect(items[1]).toHaveClass('lm-versions__item--auto')
    expect(screen.getByLabelText('Version name')).toHaveValue('')

    // An empty label gets a default name.
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(history.versions.at(-1)?.label).toBe('Version 3')

    fireEvent.click(screen.getByTestId('vl-restore-v1'))
    expect(level()).toBe(0.8)
    expect(onRestore).toHaveBeenCalledWith(expect.objectContaining({ id: 'v1' }))

    fireEvent.click(screen.getByRole('button', { name: 'Remove half' }))
    expect(history.versions.map((version) => version.id)).toEqual(['v1', 'v3'])
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('tells the host of a restore that landed, not of one a lock refused', () => {
    const clock = { ms: 60_000 }
    const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
    const arbiter = new Arbiter(document, {
      now: () => clock.ms,
      setTimeoutFn: () => 0,
      clearTimeoutFn: () => {},
    })
    const history = new VersionHistory(document, { now: () => clock.ms, arbiter, id: () => 'v1' })
    const level = (): number => findStripHost(document.score, 'kick')?.strip.level ?? NaN
    const onRestore = vi.fn()
    render(<VersionList versions={history} data-testid="vl" onRestore={onRestore} />)
    act(() => {
      document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 })
    })

    // Something of the system's has the level (a bounce under way, say): a person's write is refused.
    const target = { kind: 'strip', owner: 'kick', param: 'level' } as const
    act(() => {
      arbiter.lock(target, { author: { id: 'bounce', kind: 'system' } })
    })
    fireEvent.click(screen.getByTestId('vl-restore-v1'))
    expect(level()).toBe(0.5)
    expect(onRestore).not.toHaveBeenCalled()

    act(() => arbiter.unlock(target))
    fireEvent.click(screen.getByTestId('vl-restore-v1'))
    expect(level()).toBe(0.8)
    expect(onRestore).toHaveBeenCalledTimes(1)
  })

  it('manualOnly hides checkpoints and shows the empty state', () => {
    const { wrapper } = rig()
    render(<VersionList manualOnly showSave={false} showRemove={false} />, { wrapper })
    expect(screen.queryByRole('listitem')).toBeNull()
    expect(screen.getByText('No versions yet.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })
})
