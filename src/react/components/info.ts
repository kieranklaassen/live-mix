// What the info view says about whatever the pointer is over, as Ableton
// Live's Info View does: a control carries its name and a sentence or two in
// two data attributes, and the view reads them off the element under the
// pointer. Nothing here needs React or a document at import time; `InfoView`
// and `useInfo` are the parts that listen.

/** The text about a control: one paragraph a line. An empty value says "nothing to say here". */
export const INFO_TEXT_ATTR = 'data-lm-info'
/** The control's name as the info view prints it; left out, the element's own name is used. */
export const INFO_TITLE_ATTR = 'data-lm-info-title'

/** What the info view shows: a name and the text under it, paragraphs split by a line break. */
export interface InfoEntry {
  title: string
  text: string
}

/** The attributes `infoProps` writes. */
export interface InfoProps {
  'data-lm-info': string
  'data-lm-info-title'?: string
}

/**
 * Attributes that give an element its entry in the info view. Spread them on
 * the control: `<button {...infoProps('Loop', 'Plays the loop again when it ends.')}>`.
 * With a null title the view names the control by its label or its text.
 */
export function infoProps(title: string | null, text: string): InfoProps {
  return title === null
    ? { [INFO_TEXT_ATTR]: text }
    : { [INFO_TEXT_ATTR]: text, [INFO_TITLE_ATTR]: title }
}

/** Several paragraphs as one text; empty ones are left out. */
export function infoText(...paragraphs: readonly (string | null | undefined | false)[]): string {
  return paragraphs.filter((paragraph): paragraph is string => Boolean(paragraph)).join('\n')
}

/** A text's paragraphs, as the view draws them. */
export function infoParagraphs(text: string): string[] {
  return text
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

const CONTROL_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
])
const CONTROL_TAGS = new Set(['a', 'button', 'input', 'label', 'select', 'summary', 'textarea'])

/** Something a person works: a button, a field, a link, or an element with such a role. */
export function isInfoControl(element: Element): boolean {
  const role = element.getAttribute('role')
  if (role !== null) return CONTROL_ROLES.has(role)
  return CONTROL_TAGS.has(element.tagName.toLowerCase())
}

/** The longest text content taken as a name; past it the element is a container, not a label. */
const NAME_MAX = 48

function squeeze(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

/** A list's entries and what is typed in a box are what the control holds, not what it is called. */
const HOLDS_TEXT = new Set(['select', 'textarea'])

/** The text under `node` but for what `skip` holds: a label's words without the list it stands around. */
function textAround(node: Node, skip: Element): string {
  if (node === skip) return ''
  if (node.nodeType === 3) return node.nodeValue ?? ''
  let text = ''
  for (const child of Array.from(node.childNodes)) text += textAround(child, skip)
  return text
}

/** The name an element goes by: its label, what labels it, else its own short text. */
export function infoName(element: Element): string {
  const label = squeeze(element.getAttribute('aria-label'))
  if (label) return label
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const named = squeeze(
      labelledBy
        .split(/\s+/)
        .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
        .join(' '),
    )
    if (named) return named
  }
  const holds = HOLDS_TEXT.has(element.tagName.toLowerCase())
  const labels = (element as HTMLInputElement).labels
  if (labels && labels.length > 0) {
    const named = squeeze(holds ? textAround(labels[0], element) : labels[0].textContent)
    if (named && named.length <= NAME_MAX) return named
  }
  const text = holds ? '' : squeeze(element.textContent)
  if (text && text.length <= NAME_MAX) return text
  return squeeze(element.getAttribute('placeholder'))
}

/** An entry and the element it was read off. */
export interface FoundInfo {
  entry: InfoEntry
  source: Element
}

/**
 * The entry for `target` and where it came from: the nearest element, from
 * the target up to `root`, that has one. An element has an entry when it
 * carries `data-lm-info`; a control without it is described by its `title`.
 * A control with neither is named, and described by whatever around it has
 * an entry. An empty `data-lm-info` ends the search with nothing: the part
 * of the page under it stays undescribed.
 */
export function findInfo(target: unknown, root?: Element | null): FoundInfo | null {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return null
  // The first control on the way up that has a name but nothing said about it.
  let named: { name: string; element: Element } | null = null
  for (let element: Element | null = target; element; element = element.parentElement) {
    const text = element.getAttribute(INFO_TEXT_ATTR)
    if (text !== null) {
      if (text.trim() === '') return null
      const title = element.getAttribute(INFO_TITLE_ATTR) ?? named?.name ?? infoName(element)
      return { entry: { title, text }, source: element }
    }
    if (isInfoControl(element)) {
      const name = infoName(element)
      const tooltip = squeeze(element.getAttribute('title'))
      if (tooltip && tooltip !== name) {
        return { entry: { title: named?.name ?? name, text: tooltip }, source: element }
      }
      if (name && !named) named = { name, element }
    }
    if (element === root) break
  }
  return named ? { entry: { title: named.name, text: '' }, source: named.element } : null
}

/** What the info view says about `target`; see `findInfo`. */
export function resolveInfo(target: unknown, root?: Element | null): InfoEntry | null {
  return findInfo(target, root)?.entry ?? null
}

export function sameInfo(a: InfoEntry | null, b: InfoEntry | null): boolean {
  return a === b || (a !== null && b !== null && a.title === b.title && a.text === b.text)
}

export interface ControlGestureOptions {
  /** The way a drag moves it. */
  axis?: 'vertical' | 'horizontal' | 'both'
  /** What a double-click or Delete sets, as the control prints it. */
  reset: string
  /** The mouse wheel moves it too. */
  wheel?: boolean
  /** The control has two places (off and on): a press switches it, and a double-click resets nothing. */
  twoPlaces?: boolean
}

/** How a knob or a fader is worked: the line the info view puts under what the control does. */
export function controlGestureInfo({
  axis = 'vertical',
  reset,
  wheel = true,
  twoPlaces = false,
}: ControlGestureOptions): string {
  const way =
    axis === 'horizontal' ? 'left or right' : axis === 'both' ? 'in any direction' : 'up or down'
  if (twoPlaces) {
    return `A press switches it, and so does Enter with the keys on it. A drag ${way}${wheel ? ', or a scroll over it,' : ''} turns it too. Delete with the keys on it returns it to ${reset}.`
  }
  return `Drag ${way}${wheel ? ', or scroll over it' : ''}. Hold Shift for fine steps. Double-click, or Delete with the keys on it, returns it to ${reset}.`
}
