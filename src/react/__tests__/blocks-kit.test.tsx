// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BlockHead,
  Card,
  Chevron,
  Choice,
  Dropdown,
  Group,
  Hint,
  KeptSheet,
  ListRow,
  MainAction,
  NamedChip,
  Pill,
  Places,
  PlainAction,
  Room,
  Row,
  Says,
  SheetPart,
  Star,
  State,
  Tick,
  Well,
} from '../components/blocks'

afterEach(cleanup)

describe('Places', () => {
  const items = [
    {
      id: 'one',
      name: 'One',
      note: 'first',
      props: { 'data-testid': 'place-one', title: 'The first' },
    },
    { id: 'two', name: 'Two' },
  ] as const

  it('lights the place in view, none when the surface shows something else, and tells a press', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Places items={items} value="one" onChange={onChange} label="Places" />,
    )
    const group = screen.getByRole('navigation', { name: 'Places' })
    expect(group).toHaveClass('lm-places')
    const [one, two] = within(group).getAllByRole('button')
    expect(one).toHaveAttribute('aria-pressed', 'true')
    expect(two).toHaveAttribute('aria-pressed', 'false')
    // What a cell is given besides goes on its button.
    expect(one).toBe(screen.getByTestId('place-one'))
    expect(one).toHaveAttribute('title', 'The first')
    expect(one).toHaveTextContent('Onefirst')
    fireEvent.click(two)
    expect(onChange).toHaveBeenCalledWith('two')
    rerender(<Places items={items} value={null} onChange={onChange} label="Places" across />)
    expect(one).toHaveAttribute('aria-pressed', 'false')
    expect(two).toHaveAttribute('aria-pressed', 'false')
    expect(group).toHaveAttribute('data-across')
  })

  it('draws an icon before the words and a level after them, out of what is read aloud', () => {
    render(
      <Places
        items={[{ id: 'mix', name: 'Mix', icon: <svg data-testid="icon" />, level: <b>bar</b> }]}
        value="mix"
        onChange={() => {}}
        label="Places"
      />,
    )
    const cell = screen.getByRole('button', { name: 'Mix' })
    expect(cell.firstElementChild).toBe(screen.getByTestId('icon'))
    const level = cell.querySelector('.lm-place__level')
    expect(level).toHaveAttribute('aria-hidden', 'true')
    expect(level).toHaveTextContent('bar')
    // With no note there is no second line.
    expect(cell.querySelector('.lm-place__note')).toBeNull()
  })
})

describe('BlockHead and State', () => {
  it('has the way back, what this is, what stands between, and its state with a lit lamp', () => {
    const onBack = vi.fn()
    render(
      <BlockHead
        data-testid="head"
        back={{ label: 'Tools', onClick: onBack, props: { 'data-testid': 'back', title: 'Out' } }}
        title="Looper"
        state="Recording"
        on
      >
        <span data-testid="between" />
      </BlockHead>,
    )
    const head = screen.getByTestId('head')
    expect(head).toHaveClass('lm-block-head')
    const back = screen.getByRole('button', { name: 'Tools' })
    expect(back).toBe(screen.getByTestId('back'))
    expect(back).toHaveClass('lm-block-head__back')
    expect(back).toHaveAttribute('title', 'Out')
    expect(back.querySelector('svg.lm-chevron')).not.toBeNull()
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(head.querySelector('.lm-block-head__title')).toHaveTextContent('Looper')
    expect(head.querySelector('.lm-block-head__rest')).toContainElement(
      screen.getByTestId('between'),
    )
    const state = head.querySelector('.lm-block-head__state')
    expect(state).toHaveTextContent('Recording')
    expect(state).toHaveAttribute('data-on')
    expect(state?.querySelector('i')).toHaveAttribute('aria-hidden', 'true')
  })

  it('leaves out the way back and the state it is not given, and its lamp is dark when not on', () => {
    const { rerender } = render(<BlockHead data-testid="head" title="Looper" />)
    const head = screen.getByTestId('head')
    expect(within(head).queryByRole('button')).toBeNull()
    expect(head.querySelector('.lm-block-head__state')).toBeNull()
    rerender(<BlockHead data-testid="head" title="Looper" state="Idle" />)
    expect(head.querySelector('.lm-block-head__state')).not.toHaveAttribute('data-on')
  })

  it('stands by itself where a head is a frame own title bar', () => {
    render(
      <State on data-testid="state" className="mine">
        Playing
      </State>,
    )
    const state = screen.getByTestId('state')
    expect(state).toHaveClass('lm-block-head__state', 'mine')
    expect(state).toHaveAttribute('data-on')
    expect(state).toHaveTextContent('Playing')
  })
})

describe('ListRow', () => {
  it('is a button with an icon, a name, a line and a chevron that goes in', () => {
    const onClick = vi.fn()
    render(
      <ListRow
        data-testid="row"
        icon={<svg data-testid="icon" />}
        name="Looper"
        line="Four bars"
        onClick={onClick}
      />,
    )
    const row = screen.getByTestId('row')
    expect(row).toHaveClass('lm-list-row')
    expect(row).toHaveAttribute('type', 'button')
    expect(row.querySelector('.lm-list-row__icon')).toContainElement(screen.getByTestId('icon'))
    expect(row.querySelector('.lm-list-row__name')).toHaveTextContent('Looper')
    expect(row.querySelector('.lm-list-row__line')).toHaveTextContent('Four bars')
    expect(row.querySelector('svg.lm-chevron.lm-list-row__go')).not.toBeNull()
    // Nothing is at work: no mark, and the row is not lifted.
    expect(row.querySelector('.lm-list-row__mark')).toBeNull()
    expect(row).not.toHaveAttribute('data-marked')
    fireEvent.click(row)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is lifted and says its mark while the thing is at work', () => {
    render(<ListRow data-testid="row" name="Looper" mark="REC" disabled />)
    const row = screen.getByTestId('row')
    expect(row).toHaveAttribute('data-marked', '')
    expect(row.querySelector('.lm-list-row__mark')).toHaveTextContent('REC')
    expect(row.querySelector('.lm-list-row__icon')).toBeNull()
    expect(row.querySelector('.lm-list-row__line')).toBeNull()
    expect(row).toBeDisabled()
  })
})

describe('Says, MainAction and PlainAction', () => {
  it('says one sentence as a paragraph', () => {
    render(<Says data-testid="says">Records what you play.</Says>)
    const says = screen.getByTestId('says')
    expect(says.tagName).toBe('P')
    expect(says).toHaveClass('lm-says')
    expect(says).toHaveTextContent('Records what you play.')
  })

  it('is filled before it is taken, in line while it runs, and small on a row', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <MainAction data-testid="main" icon={<svg data-testid="icon" />} onClick={onClick}>
        Record
      </MainAction>,
    )
    const main = screen.getByTestId('main')
    expect(main).toHaveClass('lm-main-action')
    expect(main).toHaveAttribute('type', 'button')
    expect(main).toHaveAttribute('data-tone', 'fill')
    expect(main).not.toHaveAttribute('data-small')
    expect(main.firstElementChild).toBe(screen.getByTestId('icon'))
    expect(main).toHaveTextContent('Record')
    fireEvent.click(main)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <MainAction data-testid="main" tone="line" small disabled onClick={onClick}>
        Stop
      </MainAction>,
    )
    expect(main).toHaveAttribute('data-tone', 'line')
    expect(main).toHaveAttribute('data-small')
    expect(main).toBeDisabled()
    fireEvent.click(main)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does one plain thing: an icon, a word, a press', () => {
    const onClick = vi.fn()
    render(
      <PlainAction
        data-testid="plain"
        title="Clears the loop"
        icon={<svg data-testid="icon" />}
        onClick={onClick}
      >
        Clear
      </PlainAction>,
    )
    const plain = screen.getByTestId('plain')
    expect(plain).toHaveClass('lm-plain-action')
    expect(plain).toHaveAttribute('type', 'button')
    expect(plain).toHaveAttribute('title', 'Clears the loop')
    expect(plain.firstElementChild).toBe(screen.getByTestId('icon'))
    expect(plain).toHaveTextContent('Clear')
    fireEvent.click(plain)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('Choice and Tick', () => {
  it('presses one of a few, and leaves a disabled one alone', () => {
    const onChange = vi.fn()
    render(
      <Choice
        label="Length"
        value={2}
        onChange={onChange}
        options={[
          { value: 1, label: '1 s', props: { 'data-testid': 'one' } },
          { value: 2, label: '2 s' },
          { value: 4, label: '4 s', disabled: true },
        ]}
      />,
    )
    const group = screen.getByRole('group', { name: 'Length' })
    expect(group).toHaveClass('lm-choice')
    expect(group).not.toHaveAttribute('data-fill')
    expect(group).not.toHaveAttribute('data-tall')
    const options = within(group).getAllByRole('button')
    expect(options.map((option) => option.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ])
    expect(options[0]).toBe(screen.getByTestId('one'))
    fireEvent.click(options[0])
    expect(onChange).toHaveBeenCalledWith(1)
    expect(options[2]).toBeDisabled()
  })

  it('fills the width it is given, holds two lines, and can be disabled whole', () => {
    render(
      <Choice
        label="Mode"
        value={null}
        onChange={() => {}}
        disabled
        fill
        tall
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    )
    const group = screen.getByRole('group', { name: 'Mode' })
    expect(group).toHaveAttribute('data-fill')
    expect(group).toHaveAttribute('data-tall')
    for (const option of within(group).getAllByRole('button')) {
      expect(option).toBeDisabled()
      expect(option).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('turns a tick over with a press', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Tick on={false} onChange={onChange} data-testid="tick">
        Latch
      </Tick>,
    )
    const tick = screen.getByTestId('tick')
    expect(tick).toHaveClass('lm-tick')
    expect(tick).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(tick)
    expect(onChange).toHaveBeenCalledWith(true)
    rerender(
      <Tick on onChange={onChange} data-testid="tick">
        Latch
      </Tick>,
    )
    expect(tick).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(tick)
    expect(onChange).toHaveBeenLastCalledWith(false)
  })
})

describe('Dropdown', () => {
  it("names a picker, lists its children and tells a pick the select's own way", () => {
    const onChange = vi.fn()
    render(
      <Dropdown
        label="Key"
        value="0"
        data-testid="key"
        onChange={(event) => {
          onChange(event.target.value)
        }}
      >
        <option value="0">C</option>
        <option value="2">D</option>
      </Dropdown>,
    )
    const list = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Key' })
    expect(list).toBe(screen.getByTestId('key'))
    expect(list.tagName).toBe('SELECT')
    expect(list).toHaveClass('lm-dropdown')
    expect([...list.options].map((option) => option.textContent)).toEqual(['C', 'D'])
    fireEvent.change(list, { target: { value: '2' } })
    expect(onChange).toHaveBeenCalledWith('2')
  })
})

describe('Group and Pill', () => {
  it('names a group by its small capitals, and lights a pill that is on', () => {
    render(
      <Group name="Played from" data-testid="group">
        <Pill on data-testid="lit">
          Keys
        </Pill>
        <Pill data-testid="dark">MIDI</Pill>
      </Group>,
    )
    const group = screen.getByRole('group', { name: 'Played from' })
    expect(group).toBe(screen.getByTestId('group'))
    expect(group).toHaveClass('lm-group')
    expect(group).not.toHaveAttribute('data-beside')
    expect(screen.getByTestId('lit')).toHaveClass('lm-pill')
    expect(screen.getByTestId('lit')).toHaveAttribute('data-on')
    expect(screen.getByTestId('dark')).not.toHaveAttribute('data-on')
  })

  it('marks a group whose name may stand beside it', () => {
    render(
      <Group name="Length" beside>
        <span />
      </Group>,
    )
    expect(screen.getByRole('group', { name: 'Length' })).toHaveAttribute('data-beside')
  })
})

describe('Room, Row, Hint and Well', () => {
  it('is the container a block is laid out by', () => {
    render(
      <Room data-testid="room" className="mine">
        <span data-testid="inside" />
      </Room>,
    )
    const room = screen.getByTestId('room')
    expect(room).toHaveClass('lm-room', 'mine')
    expect(room).toContainElement(screen.getByTestId('inside'))
  })

  it('puts a name, the control and a hint on one row, under a class that is not the channel row', () => {
    const { rerender } = render(
      <Row data-testid="row" name="Speed" hint="Half as fast">
        <button type="button" data-testid="control" />
      </Row>,
    )
    const row = screen.getByTestId('row')
    expect(row).toHaveClass('lm-block-row')
    expect(row).not.toHaveClass('lm-row')
    expect([...row.children].map((child) => child.className || child.tagName)).toEqual([
      'lm-block-row__name',
      'BUTTON',
      'lm-block-row__hint',
    ])
    expect(row.querySelector('.lm-block-row__name')).toHaveTextContent('Speed')
    expect(row.querySelector('.lm-block-row__hint')).toHaveTextContent('Half as fast')
    rerender(
      <Row data-testid="row" name="Speed">
        <button type="button" data-testid="control" />
      </Row>,
    )
    expect(row.querySelector('.lm-block-row__hint')).toBeNull()
  })

  it('says a short line of help', () => {
    render(<Hint data-testid="hint">Hold to latch</Hint>)
    const hint = screen.getByTestId('hint')
    expect(hint.tagName).toBe('SPAN')
    expect(hint).toHaveClass('lm-hint')
    expect(hint).toHaveTextContent('Hold to latch')
  })

  it('is a well of the kit, with a caption after what is drawn in it', () => {
    const { rerender } = render(
      <Well data-testid="well" caption="The loop shows here">
        <canvas data-testid="drawn" />
      </Well>,
    )
    const well = screen.getByTestId('well')
    expect(well).toHaveClass('lm-well', 'lm-block-well')
    const caption = well.querySelector('.lm-block-well__caption')
    expect(caption).toHaveTextContent('The loop shows here')
    expect(well.firstElementChild).toBe(screen.getByTestId('drawn'))
    expect(well.lastElementChild).toBe(caption)
    rerender(<Well data-testid="well" />)
    expect(well.querySelector('.lm-block-well__caption')).toBeNull()
  })
})

describe('Card', () => {
  it('is pressed when picked, and shows how far along it is only while at work', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <Card data-testid="card" onClick={onClick}>
        Am
      </Card>,
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('lm-card')
    expect(card).toHaveAttribute('type', 'button')
    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(card).not.toHaveAttribute('data-active')
    expect(card.querySelector('.lm-card__progress')).toBeNull()
    expect(card.style.getPropertyValue('--lm-card-progress')).toBe('')
    fireEvent.click(card)
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(
      <Card data-testid="card" picked active progress={0.25} style={{ minWidth: 40 }}>
        Am
      </Card>,
    )
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(card).toHaveAttribute('data-active')
    expect(card.querySelector('.lm-card__progress')).toHaveAttribute('aria-hidden', 'true')
    // The progress is a variable on the card, beside the style it was given.
    expect(card.style.getPropertyValue('--lm-card-progress')).toBe('0.25')
    expect(card.style.minWidth).toBe('40px')
    expect(card).toHaveTextContent('Am')
  })

  it('hands its button to a ref, for a caller that moves the progress itself', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Card ref={ref} active data-testid="card">
        C
      </Card>,
    )
    const card = screen.getByTestId('card')
    expect(ref.current).toBe(card)
    ref.current?.style.setProperty('--lm-card-progress', '0.5')
    expect(card.style.getPropertyValue('--lm-card-progress')).toBe('0.5')
  })
})

describe('NamedChip', () => {
  it('is a button with its name alone, and a press', () => {
    const onClick = vi.fn()
    render(
      <NamedChip data-testid="chip" title="A warm pad" onClick={onClick}>
        Warm pad
      </NamedChip>,
    )
    const chip = screen.getByTestId('chip')
    expect(chip).toHaveClass('lm-named-chip')
    expect(chip).not.toHaveClass('lm-chip')
    expect(chip).toHaveAttribute('type', 'button')
    expect(chip).toHaveAttribute('title', 'A warm pad')
    expect([...chip.children].map((child) => child.getAttribute('class'))).toEqual([
      'lm-named-chip__name',
    ])
    expect(chip.querySelector('.lm-named-chip__name')).toHaveTextContent('Warm pad')
    fireEvent.click(chip)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('has a swatch of its colour before the name, and a lit star after it when starred', () => {
    render(
      <NamedChip data-testid="chip" swatch="rgb(10, 20, 30)" starred disabled>
        Glass
      </NamedChip>,
    )
    const chip = screen.getByTestId('chip')
    expect([...chip.children].map((child) => child.getAttribute('class'))).toEqual([
      'lm-named-chip__swatch',
      'lm-named-chip__name',
      'lm-star lm-named-chip__star',
    ])
    const swatch = chip.querySelector<HTMLElement>('i.lm-named-chip__swatch')
    expect(swatch).toHaveAttribute('aria-hidden', 'true')
    expect(swatch?.style.background).toBe('rgb(10, 20, 30)')
    const star = chip.querySelector('svg.lm-named-chip__star')
    expect(star).toHaveAttribute('data-on')
    expect(star?.querySelector('path')).toHaveAttribute('fill', 'currentColor')
    expect(chip).toBeDisabled()
  })
})

describe('KeptSheet', () => {
  function Opened({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} data-testid="opener" />
        <KeptSheet
          open={open}
          onClose={() => {
            setOpen(false)
            onClose()
          }}
          title="Inputs"
          foot="A line"
          data-testid="sheet"
          closeProps={{ 'data-testid': 'close' }}
        >
          <SheetPart name="Keyboard" state="On" on line="What it is">
            <button type="button" data-testid="inside" />
          </SheetPart>
        </KeptSheet>
      </>
    )
  }

  /** The ground a sheet lies on: the element that is hidden while it is closed. */
  function ground(): HTMLElement {
    const found = screen.getByTestId('sheet').parentElement
    if (!found) throw new Error('the sheet has no ground')
    return found
  }

  it('keeps what is in it mounted while closed, and takes the focus as it opens', () => {
    render(<Opened onClose={() => {}} />)
    const sheet = screen.getByTestId('sheet')
    expect(ground()).toHaveClass('lm-kept-sheet-ground')
    expect(ground()).toHaveAttribute('role', 'presentation')
    expect(ground().hidden).toBe(true)
    expect(screen.getByTestId('inside')).toBeInTheDocument()
    const opener = screen.getByTestId('opener')
    opener.focus()
    fireEvent.click(opener)
    expect(ground().hidden).toBe(false)
    expect(screen.getByRole('dialog', { name: 'Inputs' })).toBe(sheet)
    expect(sheet).toHaveClass('lm-kept-sheet')
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    expect(within(sheet).getByRole('heading', { name: 'Inputs', level: 2 })).toHaveClass(
      'lm-kept-sheet__title',
    )
    expect(sheet.querySelector('.lm-kept-sheet__body')).toContainElement(
      screen.getByTestId('inside'),
    )
    expect(sheet.querySelector('.lm-kept-sheet__foot')).toHaveTextContent('A line')
    expect(screen.getByRole('group', { name: 'Keyboard' })).toBeInTheDocument()
    expect(screen.getByTestId('close')).toHaveClass('lm-kept-sheet__close')
    expect(screen.getByTestId('close')).toHaveTextContent('Close')
    expect(document.activeElement).toBe(screen.getByTestId('close'))
    // And gives it back to where it was.
    fireEvent.click(screen.getByTestId('close'))
    expect(ground().hidden).toBe(true)
    expect(document.activeElement).toBe(opener)
  })

  it('closes on Escape and on a press beside it, not on one inside, and hears no key while closed', () => {
    const onClose = vi.fn()
    render(<Opened onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('opener'))
    fireEvent.mouseDown(screen.getByTestId('inside'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('opener'))
    fireEvent.mouseDown(ground())
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('hears Escape before the page does, so a page that takes the key for itself is not told', () => {
    const onClose = vi.fn()
    const page = vi.fn((event: KeyboardEvent) => event.preventDefault())
    window.addEventListener('keydown', page)
    render(<Opened onClose={onClose} />)
    fireEvent.click(screen.getByTestId('opener'))
    fireEvent.keyDown(screen.getByTestId('inside'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(page).not.toHaveBeenCalled()
    // Closed, the key is the page's again.
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(page).toHaveBeenCalledTimes(1)
    window.removeEventListener('keydown', page)
  })

  it('keeps the Tab key inside while it is open: round from the last stop to the first, and back', () => {
    render(<Opened onClose={() => {}} />)
    fireEvent.click(screen.getByTestId('opener'))
    const close = screen.getByTestId('close')
    const inside = screen.getByTestId('inside')
    inside.focus()
    expect(fireEvent.keyDown(inside, { key: 'Tab' })).toBe(false)
    expect(document.activeElement).toBe(close)
    expect(fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(inside)
    // Between two stops of the sheet the key is the browser's.
    expect(fireEvent.keyDown(inside, { key: 'Tab', shiftKey: true })).toBe(true)
    // From outside it the focus comes in.
    screen.getByTestId('opener').focus()
    fireEvent.keyDown(document.body, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
  })

  it('leaves out the foot it is not given', () => {
    render(
      <KeptSheet open onClose={() => {}} title="Inputs" data-testid="sheet">
        <span />
      </KeptSheet>,
    )
    expect(screen.getByTestId('sheet').querySelector('.lm-kept-sheet__foot')).toBeNull()
  })
})

describe('SheetPart', () => {
  it('is a group named by its heading, with its state, a line and its controls', () => {
    render(
      <SheetPart data-testid="part" name="Keyboard" state="On" on line="What it is">
        <button type="button" data-testid="inside" />
      </SheetPart>,
    )
    const part = screen.getByRole('group', { name: 'Keyboard' })
    expect(part).toBe(screen.getByTestId('part'))
    expect(part).toHaveClass('lm-sheet-part')
    expect(within(part).getByRole('heading', { name: 'Keyboard', level: 3 })).toHaveClass(
      'lm-sheet-part__name',
    )
    const state = part.querySelector('.lm-sheet-part__state')
    expect(state).toHaveTextContent('On')
    expect(state).toHaveAttribute('data-on')
    expect(part.querySelector('p.lm-sheet-part__line')).toHaveTextContent('What it is')
    expect(part.lastElementChild).toBe(screen.getByTestId('inside'))
  })

  it('leaves out the state and the line it is not given, and a state that is not there is dark', () => {
    const { rerender } = render(<SheetPart data-testid="part" name="MIDI" />)
    const part = screen.getByTestId('part')
    expect(part.querySelector('.lm-sheet-part__state')).toBeNull()
    expect(part.querySelector('.lm-sheet-part__line')).toBeNull()
    rerender(<SheetPart data-testid="part" name="MIDI" state="None found" />)
    expect(part.querySelector('.lm-sheet-part__state')).not.toHaveAttribute('data-on')
  })
})

describe('Chevron and Star', () => {
  it('points forward to go in and back for the way out', () => {
    const { container } = render(
      <>
        <Chevron className="mine" />
        <Chevron back />
      </>,
    )
    const [forward, back] = container.querySelectorAll('svg.lm-chevron')
    expect(forward).toHaveClass('mine')
    expect(forward).toHaveAttribute('aria-hidden', 'true')
    expect(forward.querySelector('path')).toHaveAttribute('d', 'M4.5 2.5L8 6L4.5 9.5')
    expect(back.querySelector('path')).toHaveAttribute('d', 'M7.5 2.5L4 6L7.5 9.5')
  })

  it('fills a star that is on', () => {
    const { container } = render(
      <>
        <Star />
        <Star on />
      </>,
    )
    const [off, on] = container.querySelectorAll('svg.lm-star')
    expect(off).not.toHaveAttribute('data-on')
    expect(off.querySelector('path')).toHaveAttribute('fill', 'none')
    expect(on).toHaveAttribute('data-on')
    expect(on.querySelector('path')).toHaveAttribute('fill', 'currentColor')
  })
})
