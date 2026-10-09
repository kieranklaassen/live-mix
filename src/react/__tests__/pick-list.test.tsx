// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Patch } from '../../core/devices/patch'
import { type DeviceDescriptor } from '../../core/devices/registry'
import {
  PickCell,
  deviceItems,
  patchItems,
  pickRows,
  pickSlug,
  type PickItem,
} from '../components/PickList'
import { tabStops } from '../components/Picker'

afterEach(cleanup)

const CHAINS: PickItem[] = [
  { id: 'clean-voice', name: 'Clean voice', detail: 'A low cut and a gentle compressor' },
  { id: 'podcast-voice', name: 'Podcast voice', detail: 'Closer and more even', more: ['voice'] },
  { id: 'over-music', name: 'Voiceover over music', detail: 'A voice that sits on a bed' },
]

describe('pickRows', () => {
  it('lists everything in the order given while nothing is typed', () => {
    expect(pickRows(CHAINS, '  ').map((row) => [row.item.id, row.match])).toEqual([
      ['clean-voice', true],
      ['podcast-voice', true],
      ['over-music', true],
    ])
  })

  it('puts what a search found first, best first, and the rest after it, dimmed', () => {
    // "voice" starts one name, is inside another, and is in what the third is for.
    expect(pickRows(CHAINS, 'voice').map((row) => [row.item.id, row.match])).toEqual([
      ['over-music', true],
      ['clean-voice', true],
      ['podcast-voice', true],
    ])
    expect(pickRows(CHAINS, 'bed').map((row) => [row.item.id, row.match])).toEqual([
      ['over-music', true],
      ['clean-voice', false],
      ['podcast-voice', false],
    ])
  })

  it('still lists everything when a search finds nothing', () => {
    expect(pickRows(CHAINS, 'zzz').map((row) => row.match)).toEqual([false, false, false])
  })
})

describe('pickSlug', () => {
  it('keeps letters and digits, and puts a dash for the rest', () => {
    expect(pickSlug('Voice, less boom')).toBe('voice-less-boom')
    expect(pickSlug('parametric-eq')).toBe('parametric-eq')
  })
})

describe('deviceItems and patchItems', () => {
  it('lists a registry’s devices under the heads of their categories, in the categories’ order', () => {
    const describe = (id: string, name: string, category: string) =>
      ({
        id,
        name,
        category,
        description: `${name} for a test`,
        kind: 'effect',
      }) as unknown as DeviceDescriptor
    const items = deviceItems([
      describe('plate-reverb', 'Plate reverb', 'reverb'),
      describe('compressor', 'Compressor', 'dynamics'),
      describe('parametric-eq', 'Parametric EQ', 'eq'),
      describe('ducker', 'Ducker', 'dynamics'),
    ])
    expect(items.map((item) => item.id)).toEqual(
      expect.arrayContaining(['plate-reverb', 'compressor', 'parametric-eq', 'ducker']),
    )
    // Two of one category stand together, in the order they were given.
    const ids = items.map((item) => item.id)
    expect(ids.indexOf('ducker')).toBe(ids.indexOf('compressor') + 1)
    expect(items.find((item) => item.id === 'compressor')?.group).toBe(
      items.find((item) => item.id === 'ducker')?.group,
    )
    expect(items.find((item) => item.id === 'compressor')?.detail).toBe('Compressor for a test')
  })

  it('lists chains by name, with what each is for', () => {
    const patch: Patch = {
      id: 'podcast-voice',
      name: 'Podcast voice',
      category: 'voice',
      description: 'Closer and more even',
      effects: [],
    }
    expect(patchItems([patch])).toEqual([
      {
        id: 'podcast-voice',
        name: 'Podcast voice',
        detail: 'Closer and more even',
        more: ['voice'],
      },
    ])
  })
})

describe('PickCell and its list', () => {
  function setup(current: string | null = 'clean-voice') {
    const onPick = vi.fn()
    render(
      <PickCell
        label="Chains for a voice"
        items={CHAINS}
        current={current}
        onPick={onPick}
        verb="Apply"
        title="The chains a voice can start from"
        cellProps={{ 'data-action': 'apply_chain' }}
        rowProps={(item) => ({ 'data-chain': item.id })}
        data-area="mix"
        data-testid="chains"
      >
        Chains
      </PickCell>,
    )
    const cell = screen.getByTestId('chains')
    return { onPick, cell }
  }
  const search = () => screen.getByRole('combobox')
  const rows = () => screen.getAllByRole('option').map((row) => row.getAttribute('data-chain'))

  it('is a cell that says it opens a dialog, with the app’s own marks on it', () => {
    const { cell } = setup()
    expect(cell).toHaveAttribute('aria-haspopup', 'dialog')
    expect(cell).toHaveAttribute('aria-expanded', 'false')
    expect(cell).toHaveAttribute('data-action', 'apply_chain')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('says what Return does in a word that is spelled right, whatever the verb', () => {
    const { cell } = setup()
    fireEvent.click(cell)
    expect(screen.getByText('Up and down move, return applies.')).toBeInTheDocument()
  })

  it('gives any other data attribute to the cell and to every row of its list', () => {
    const { cell } = setup()
    expect(cell).toHaveAttribute('data-area', 'mix')
    fireEvent.click(cell)
    const options = screen.getAllByRole('option')
    expect(options.length).toBe(CHAINS.length)
    for (const row of options) expect(row).toHaveAttribute('data-area', 'mix')
    // A row keeps the marks that are its own.
    expect(rows()).toEqual(CHAINS.map((chain) => chain.id))
    // The list is not the cell: the panel carries no mark of the cell's.
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-area')
  })

  it('opens on what is on now, with the keys in the search', () => {
    const { cell } = setup('podcast-voice')
    fireEvent.click(cell)
    const dialog = screen.getByRole('dialog', { name: 'Chains for a voice' })
    expect(cell).toHaveAttribute('aria-expanded', 'true')
    expect(search()).toHaveFocus()
    expect(within(dialog).getByRole('option', { selected: true })).toHaveAttribute(
      'data-chain',
      'podcast-voice',
    )
    // What is on is not applied again.
    expect(screen.getByTestId('chains-list-action')).toBeDisabled()
    expect(screen.getByTestId('chains-list-action')).toHaveTextContent('On Podcast voice')
    expect(screen.getByTestId('chains-list-search-count')).toHaveTextContent('3')
  })

  it('moves the cursor with the arrows and picks with return, which closes it', () => {
    const { cell, onPick } = setup()
    fireEvent.click(cell)
    fireEvent.keyDown(search(), { key: 'ArrowDown' })
    expect(screen.getByRole('option', { selected: true })).toHaveAttribute(
      'data-chain',
      'podcast-voice',
    )
    expect(screen.getByTestId('chains-list-action')).toHaveTextContent('Apply Podcast voice')
    fireEvent.keyDown(search(), { key: 'Enter' })
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick.mock.calls[0][0].id).toBe('podcast-voice')
    expect(onPick.mock.calls[0][1]).toBe(false)
    expect(screen.queryByRole('dialog')).toBeNull()
    // The keys go back to the cell the list hung off.
    expect(cell).toHaveFocus()
  })

  it('stays open on a pick with shift held', () => {
    const { cell, onPick } = setup()
    fireEvent.click(cell)
    fireEvent.keyDown(search(), { key: 'ArrowDown' })
    fireEvent.keyDown(search(), { key: 'Enter', shiftKey: true })
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'podcast-voice' }), true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('is one return for a key held down', () => {
    const { cell, onPick } = setup()
    fireEvent.click(cell)
    fireEvent.keyDown(search(), { key: 'ArrowDown' })
    fireEvent.keyDown(search(), { key: 'Enter', repeat: true })
    expect(onPick).not.toHaveBeenCalled()
  })

  it('searches: what it found leads, the first found is what return picks, and the letters are marked', () => {
    const { cell, onPick } = setup()
    fireEvent.click(cell)
    fireEvent.change(search(), { target: { value: 'bed' } })
    expect(rows()).toEqual(['over-music', 'clean-voice', 'podcast-voice'])
    expect(screen.getByTestId('chains-list-search-count')).toHaveTextContent('1 of 3')
    expect(screen.getByTestId('chains-list-row-clean-voice')).toHaveClass('lm-picker__row--dim')
    fireEvent.change(search(), { target: { value: 'pod' } })
    expect(
      screen.getByTestId('chains-list-row-podcast-voice').querySelector('.lm-match'),
    ).toHaveTextContent('Pod')
    fireEvent.keyDown(search(), { key: 'Enter' })
    expect(onPick.mock.calls[0][0].id).toBe('podcast-voice')
  })

  it('has nothing to pick when a search finds nothing, until an arrow puts the cursor on a row', () => {
    const { cell, onPick } = setup()
    fireEvent.click(cell)
    fireEvent.change(search(), { target: { value: 'zzz' } })
    expect(screen.getByTestId('chains-list-action')).toBeDisabled()
    expect(screen.getByTestId('chains-list-action')).toHaveTextContent('Nothing to apply')
    fireEvent.keyDown(search(), { key: 'Enter' })
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.keyDown(search(), { key: 'ArrowDown' })
    expect(screen.getByRole('option', { selected: true })).toHaveAttribute(
      'data-chain',
      'clean-voice',
    )
  })

  it('takes a press for the cursor and a double press for a pick', () => {
    const { cell, onPick } = setup()
    fireEvent.click(cell)
    const row = screen.getByTestId('chains-list-row-over-music')
    fireEvent.click(row)
    expect(row).toHaveAttribute('aria-selected', 'true')
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.doubleClick(row)
    expect(onPick.mock.calls[0][0].id).toBe('over-music')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on escape and on a press outside, and picks nothing', () => {
    const { cell, onPick } = setup()
    fireEvent.click(cell)
    fireEvent.keyDown(search(), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cell).toHaveFocus()
    fireEvent.click(cell)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onPick).not.toHaveBeenCalled()
  })

  it('sends a letter typed on its action to the search, and keeps the page’s keys out', () => {
    const { cell } = setup()
    const onPageKey = vi.fn()
    document.addEventListener('keydown', onPageKey)
    fireEvent.click(cell)
    fireEvent.keyDown(search(), { key: 'ArrowDown' })
    const action = screen.getByTestId('chains-list-action')
    action.focus()
    fireEvent.keyDown(action, { key: 'p' })
    expect(search()).toHaveFocus()
    expect(search()).toHaveValue('p')
    expect(onPageKey).not.toHaveBeenCalled()
    document.removeEventListener('keydown', onPageKey)
  })

  it('keeps tab inside the panel', () => {
    const { cell } = setup()
    fireEvent.click(cell)
    fireEvent.keyDown(search(), { key: 'ArrowDown' })
    const stops = tabStops(screen.getByRole('dialog'))
    expect(stops).toEqual([search(), screen.getByTestId('chains-list-action')])
    const action = screen.getByTestId('chains-list-action')
    action.focus()
    fireEvent.keyDown(action, { key: 'Tab' })
    expect(search()).toHaveFocus()
    fireEvent.keyDown(search(), { key: 'Tab', shiftKey: true })
    expect(action).toHaveFocus()
  })

  it('opens as a new list each time: nothing typed, the cursor on what is on', () => {
    const { cell } = setup()
    fireEvent.click(cell)
    fireEvent.change(search(), { target: { value: 'bed' } })
    fireEvent.keyDown(search(), { key: 'Escape' })
    fireEvent.click(cell)
    expect(search()).toHaveValue('')
    expect(screen.getByRole('option', { selected: true })).toHaveAttribute(
      'data-chain',
      'clean-voice',
    )
  })

  it('heads each group while nothing is typed, and leaves the heads out of a search', () => {
    render(
      <PickCell
        label="Effects"
        items={[
          { id: 'eq', name: 'EQ', group: 'Tone' },
          { id: 'compressor', name: 'Compressor', group: 'Dynamics' },
          { id: 'ducker', name: 'Ducker', group: 'Dynamics' },
        ]}
        onPick={() => {}}
        verb="Add"
        data-testid="add"
      >
        Add effect
      </PickCell>,
    )
    fireEvent.click(screen.getByTestId('add'))
    const heads = () =>
      [...document.querySelectorAll('.lm-picker__group')].map((head) => head.textContent)
    expect(heads()).toEqual(['Tone1', 'Dynamics2'])
    // Nothing is on, so the cursor starts on the first row: Return has something to add.
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('EQ')
    expect(screen.getByTestId('add-list-action')).toHaveTextContent('Add EQ')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'duck' } })
    expect(heads()).toEqual([])
    expect(screen.getByTestId('add-list-action')).toHaveTextContent('Add Ducker')
  })
})
