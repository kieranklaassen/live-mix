// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Check, Input, Segmented, Select } from '../components/fields'
import { Glyph } from '../components/Glyph'
import { InlineNote } from '../components/InlineNote'
import { Menu, MenuItem, MenuSeparator } from '../components/Menu'
import { Panel, PanelHead, PropRow, SectionLabel, Tabs } from '../components/Panel'
import { Sheet } from '../components/Sheet'
import { TextButton } from '../components/TextButton'

afterEach(cleanup)

describe('Panel chrome', () => {
  it('builds a panel from a head, a section label and property rows', () => {
    render(
      <Panel aria-label="Inspector" data-testid="panel">
        <PanelHead
          title="Zoom"
          glyph={<Glyph kind="zoom" />}
          actions={<TextButton cell>Close</TextButton>}
        />
        <SectionLabel aside={<span>2</span>}>Timing</SectionLabel>
        <PropRow label="Start" htmlFor="start">
          <Input id="start" value="00:44.0" onChange={() => {}} numeric />
        </PropRow>
        <PropRow label="Length">
          <span className="lm-prop__text">6.0 s</span>
        </PropRow>
      </Panel>,
    )
    const panel = screen.getByRole('region', { name: 'Inspector' })
    expect(panel).toHaveClass('lm-panel')
    expect(within(panel).getByRole('heading', { name: 'Zoom', level: 2 })).toBeInTheDocument()
    expect(panel.querySelector('.lm-panel__head .lm-glyph--zoom')).not.toBeNull()
    expect(within(panel).getByRole('button', { name: 'Close' })).toHaveClass('lm-btn--cell')
    expect(panel.querySelector('.lm-section-label')).toHaveTextContent('Timing2')
    // The label names its field.
    expect(within(panel).getByLabelText('Start')).toHaveValue('00:44.0')
    expect(panel.querySelectorAll('.lm-prop')).toHaveLength(2)
  })
})

describe('Tabs', () => {
  const tabs = [
    { id: 'transcript', label: 'Transcript' },
    { id: 'notes', label: 'Notes', count: 3 },
  ]

  it('marks the selected tab, shows a count, and reports a press', () => {
    const onSelect = vi.fn()
    render(<Tabs tabs={tabs} selected="transcript" onSelect={onSelect} data-action="show_panel" />)
    const [transcript, notes] = screen.getAllByRole('tab')
    expect(transcript).toHaveAttribute('aria-selected', 'true')
    expect(notes).toHaveAttribute('aria-selected', 'false')
    expect(notes).toHaveTextContent('Notes3')
    // What a tab does is marked on the tab itself.
    expect(transcript).toHaveAttribute('data-action', 'show_panel')
    expect(notes).toHaveAttribute('data-action', 'show_panel')
    fireEvent.click(notes)
    expect(onSelect).toHaveBeenCalledWith('notes')
  })

  it('keeps one tab in the tab order and moves between tabs with the arrow keys', () => {
    const onSelect = vi.fn()
    render(<Tabs tabs={tabs} selected="transcript" onSelect={onSelect} />)
    const [transcript, notes] = screen.getAllByRole('tab')
    expect(transcript).toHaveAttribute('tabindex', '0')
    expect(notes).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(transcript, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith('notes')
    expect(notes).toHaveFocus()
    fireEvent.keyDown(transcript, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith('notes')
    fireEvent.keyDown(transcript, { key: 'End' })
    expect(onSelect).toHaveBeenLastCalledWith('notes')
    fireEvent.keyDown(transcript, { key: 'a' })
    expect(onSelect).toHaveBeenCalledTimes(3)
  })

  it('has no selected tab while its panel is closed, and the first tab takes the focus', () => {
    render(<Tabs tabs={tabs} selected={null} onSelect={() => {}} aside={<span>aside</span>} />)
    const [transcript, notes] = screen.getAllByRole('tab')
    expect(transcript).toHaveAttribute('aria-selected', 'false')
    expect(notes).toHaveAttribute('aria-selected', 'false')
    expect(transcript).toHaveAttribute('tabindex', '0')
    expect(screen.getByText('aside')).toBeInTheDocument()
  })
})

describe('TextButton', () => {
  it('is a plain button with its words, and passes what it is given to the button', () => {
    const onClick = vi.fn()
    render(
      <TextButton data-action="split" title="Split at the playhead" onClick={onClick}>
        Split
      </TextButton>,
    )
    const button = screen.getByRole('button', { name: 'Split' })
    expect(button).toHaveClass('lm-btn')
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('data-action', 'split')
    expect(button).not.toHaveAttribute('aria-pressed')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('takes a class per variant and shape, and shows its shortcut', () => {
    render(
      <>
        <TextButton variant="primary" size="large">
          Export
        </TextButton>
        <TextButton variant="quiet" pressed>
          Agent
        </TextButton>
        <TextButton variant="danger" cell shortcut="⌫">
          Remove
        </TextButton>
        <TextButton icon aria-label="Undo">
          <Glyph kind="undo" />
        </TextButton>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Export' })).toHaveClass(
      'lm-btn--primary',
      'lm-btn--large',
    )
    const agent = screen.getByRole('button', { name: 'Agent' })
    expect(agent).toHaveClass('lm-btn--quiet')
    expect(agent).toHaveAttribute('aria-pressed', 'true')
    const remove = screen.getByRole('button', { name: /Remove/ })
    expect(remove).toHaveClass('lm-btn--danger', 'lm-btn--cell')
    expect(remove.querySelector('.lm-key')).toHaveTextContent('⌫')
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveClass('lm-btn--icon')
  })

  it('does nothing while disabled', () => {
    const onClick = vi.fn()
    render(
      <TextButton disabled onClick={onClick}>
        Redo
      </TextButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('the fields', () => {
  it('Input reports the text, and a number takes the mono face', () => {
    const onChange = vi.fn()
    render(
      <Input
        value="2.2"
        onChange={onChange}
        numeric
        boxed
        aria-label="Amount"
        data-action="set_zoom"
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })
    expect(input).toHaveClass('lm-input', 'lm-input--numeric', 'lm-input--boxed')
    expect(input).toHaveAttribute('data-action', 'set_zoom')
    fireEvent.change(input, { target: { value: '3' } })
    expect(onChange).toHaveBeenCalledWith('3')
  })

  it('Select lists its options and reports the chosen value', () => {
    const onChange = vi.fn()
    render(
      <Select
        value="h264"
        options={[
          { value: 'h264', label: 'H.264' },
          { value: 'hevc', label: 'HEVC', disabled: true },
          'ProRes',
        ]}
        onChange={onChange}
        aria-label="Format"
        data-action="choose_format"
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Format' })
    expect(select).toHaveAttribute('data-action', 'choose_format')
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['H.264', 'HEVC', 'ProRes'])
    expect(within(select).getByRole('option', { name: 'HEVC' })).toBeDisabled()
    fireEvent.change(select, { target: { value: 'ProRes' } })
    expect(onChange).toHaveBeenCalledWith('ProRes')
  })

  it('Segmented presses the chosen option and reports another', () => {
    const onChange = vi.fn()
    render(
      <Segmented
        label="Bottom area"
        options={[
          { value: 'timeline', label: 'Timeline' },
          { value: 'mixer', label: 'Mixer' },
        ]}
        value="timeline"
        onChange={onChange}
        fill
        data-action="show_panel"
      />,
    )
    const group = screen.getByRole('group', { name: 'Bottom area' })
    expect(group).toHaveClass('lm-seg', 'lm-seg--fill')
    const [timeline, mixer] = within(group).getAllByRole('button')
    expect(timeline).toHaveAttribute('aria-pressed', 'true')
    expect(mixer).toHaveAttribute('aria-pressed', 'false')
    expect(mixer).toHaveAttribute('data-action', 'show_panel')
    fireEvent.click(mixer)
    expect(onChange).toHaveBeenCalledWith('mixer')
  })

  it('Check reports the new state and is named by its words', () => {
    const onChange = vi.fn()
    render(<Check checked={false} onChange={onChange} label="Snap" data-action="set_snap" />)
    const check = screen.getByRole('checkbox', { name: 'Snap' })
    expect(check).toHaveAttribute('data-action', 'set_snap')
    fireEvent.click(check)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('Menu', () => {
  it('lists its items with their shortcuts and a separator, and runs the one pressed', () => {
    const onSave = vi.fn()
    const onNew = vi.fn()
    render(
      <Menu
        aria-label="Project"
        items={[
          { label: 'New', onSelect: onNew, disabled: true },
          'separator',
          { label: 'Save', shortcut: '⌘S', onSelect: onSave },
        ]}
      />,
    )
    const menu = screen.getByRole('menu', { name: 'Project' })
    const [first, second] = within(menu).getAllByRole('menuitem')
    expect(first).toBeDisabled()
    expect(second).toHaveTextContent('Save⌘S')
    expect(within(menu).getAllByRole('separator')).toHaveLength(1)
    fireEvent.click(first)
    fireEvent.click(second)
    expect(onNew).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('takes items as children, each with attributes of its own, and marks the one in force', () => {
    const onPaper = vi.fn()
    render(
      <Menu>
        <MenuItem onSelect={() => {}} data-action="save_project">
          Save
        </MenuItem>
        <MenuSeparator />
        <MenuItem checked onSelect={() => {}} data-action="choose_scheme">
          Graphite
        </MenuItem>
        <MenuItem checked={false} onSelect={onPaper} data-action="choose_scheme">
          Paper
        </MenuItem>
      </Menu>,
    )
    expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveAttribute(
      'data-action',
      'save_project',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Graphite' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    const paper = screen.getByRole('menuitemradio', { name: 'Paper' })
    expect(paper).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(paper)
    expect(onPaper).toHaveBeenCalledOnce()
  })

  it('moves between items with the arrow keys, past a disabled one, and closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Menu
        onClose={onClose}
        items={[
          { label: 'Open', onSelect: () => {} },
          { label: 'Locked', onSelect: () => {}, disabled: true },
          { label: 'Save', onSelect: () => {} },
        ]}
      />,
    )
    const menu = screen.getByRole('menu')
    const open = screen.getByRole('menuitem', { name: 'Open' })
    const save = screen.getByRole('menuitem', { name: 'Save' })
    open.focus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(save).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(open).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'End' })
    expect(save).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(open).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('Sheet', () => {
  it('is a dialog named by its title, with its buttons in the foot', () => {
    render(
      <Sheet
        title="Import"
        onClose={() => {}}
        width={520}
        footer={<TextButton variant="primary">Open in the editor</TextButton>}
      >
        <p>Three channels found.</p>
      </Sheet>,
    )
    const sheet = screen.getByRole('dialog', { name: 'Import' })
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    expect(sheet).toHaveStyle({ width: '520px' })
    expect(sheet.parentElement).toHaveClass('lm-scrim')
    expect(within(sheet).getByText('Three channels found.')).toBeInTheDocument()
    expect(sheet.querySelector('.lm-sheet__foot')).toContainElement(
      screen.getByRole('button', { name: 'Open in the editor' }),
    )
  })

  it('takes the focus when it opens, closes on Escape, and gives the focus back when it goes', () => {
    const onClose = vi.fn()
    function Host({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">Import…</button>
          {open ? (
            <Sheet title="Import" onClose={onClose} footer={<TextButton>Done</TextButton>}>
              <Input value="" onChange={() => {}} aria-label="Name" />
            </Sheet>
          ) : null}
        </>
      )
    }
    const view = render(<Host open={false} />)
    const opener = screen.getByRole('button', { name: 'Import…' })
    opener.focus()
    view.rerender(<Host open />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    view.rerender(<Host open={false} />)
    expect(opener).toHaveFocus()
  })

  it('keeps Tab inside it', () => {
    render(
      <Sheet title="Export" onClose={() => {}} footer={<TextButton>Export</TextButton>}>
        <Input value="" onChange={() => {}} aria-label="Save as" />
      </Sheet>,
    )
    const sheet = screen.getByRole('dialog')
    const first = screen.getByRole('textbox', { name: 'Save as' })
    const last = screen.getByRole('button', { name: 'Export' })
    last.focus()
    fireEvent.keyDown(sheet, { key: 'Tab' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(sheet, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })
})

describe('InlineNote', () => {
  it('says what happened and what it means, with one button', () => {
    render(
      <InlineNote
        title="The agent has no model key."
        action={<TextButton>Account</TextButton>}
        data-testid="note"
      >
        Add your own key under Account.
      </InlineNote>,
    )
    const note = screen.getByTestId('note')
    expect(note).toHaveClass('lm-inline-note')
    expect(note).not.toHaveClass('lm-inline-note--danger')
    expect(note).not.toHaveAttribute('role')
    expect(note.querySelector('.lm-inline-note__title')).toHaveTextContent(
      'The agent has no model key.',
    )
    expect(note.querySelector('.lm-inline-note__text')).toHaveTextContent(
      'Add your own key under Account.',
    )
    expect(within(note).getByRole('button', { name: 'Account' })).toBeInTheDocument()
  })

  it('takes the danger tone and the role it is given', () => {
    render(<InlineNote tone="danger" role="alert" title="Nothing was imported." />)
    const note = screen.getByRole('alert')
    expect(note).toHaveClass('lm-inline-note--danger')
    expect(note.querySelector('.lm-inline-note__text')).toBeNull()
    expect(note.querySelector('.lm-glyph--alert')).not.toBeNull()
  })
})
