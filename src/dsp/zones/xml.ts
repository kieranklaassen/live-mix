// A small XML reader: elements, attributes and nothing else, which is all an
// instrument preset needs. Comments, processing instructions, doctypes, text
// and CDATA are skipped. It never throws: what it cannot make sense of is
// named in `warnings` and the elements read so far are returned.

export interface XmlElement {
  name: string
  attributes: Record<string, string>
  children: XmlElement[]
}

export interface XmlDocument {
  /** The top-level elements (one, in a well-formed document). */
  roots: XmlElement[]
  warnings: string[]
}

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

export function decodeXmlText(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z]+);/g, (whole, name: string) => {
    if (name.startsWith('#')) {
      const code = name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole
    }
    return ENTITIES[name] ?? whole
  })
}

export function encodeXmlAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const ATTRIBUTE = /([^\s=/<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

export function parseXml(text: string): XmlDocument {
  const source = (typeof text === 'string' ? text : '').replace(/^\uFEFF/, '')
  const warnings: string[] = []
  const roots: XmlElement[] = []
  const open: XmlElement[] = []
  let at = 0
  const skipTo = (terminator: string, what: string): boolean => {
    const end = source.indexOf(terminator, at)
    if (end < 0) {
      warnings.push(`${what} is never closed`)
      at = source.length
      return false
    }
    at = end + terminator.length
    return true
  }
  while (at < source.length) {
    const start = source.indexOf('<', at)
    if (start < 0) break
    at = start
    if (source.startsWith('<!--', at)) {
      skipTo('-->', 'a comment')
    } else if (source.startsWith('<![CDATA[', at)) {
      skipTo(']]>', 'a CDATA section')
    } else if (source.startsWith('<?', at)) {
      skipTo('?>', 'a processing instruction')
    } else if (source.startsWith('<!', at)) {
      skipTo('>', 'a declaration')
    } else if (source.startsWith('</', at)) {
      const end = source.indexOf('>', at)
      if (end < 0) {
        warnings.push('a closing tag is never closed')
        break
      }
      const name = source.slice(at + 2, end).trim()
      at = end + 1
      const depth = open.map((element) => element.name).lastIndexOf(name)
      if (depth < 0) warnings.push(`</${name}> closes nothing`)
      else {
        if (depth < open.length - 1)
          warnings.push(`<${open[open.length - 1].name}> is never closed`)
        open.length = depth
      }
    } else {
      // The tag ends at the first `>` outside a quoted value.
      let end = at + 1
      let quote = ''
      while (end < source.length) {
        const character = source[end]
        if (quote !== '') {
          if (character === quote) quote = ''
        } else if (character === '"' || character === "'") {
          quote = character
        } else if (character === '>') {
          break
        }
        end += 1
      }
      if (end >= source.length) {
        warnings.push('a tag is never closed')
        break
      }
      let body = source.slice(at + 1, end)
      at = end + 1
      const selfClosing = body.endsWith('/')
      if (selfClosing) body = body.slice(0, -1)
      const name = /^[^\s/]+/.exec(body)?.[0]
      if (name === undefined) {
        warnings.push('a tag has no name')
        continue
      }
      const element: XmlElement = { name, attributes: {}, children: [] }
      for (const match of body.slice(name.length).matchAll(ATTRIBUTE)) {
        element.attributes[match[1]] = decodeXmlText(match[2] ?? match[3] ?? '')
      }
      const parent = open[open.length - 1]
      if (parent) parent.children.push(element)
      else roots.push(element)
      if (!selfClosing) open.push(element)
    }
  }
  if (open.length > 0) warnings.push(`<${open[open.length - 1].name}> is never closed`)
  return { roots, warnings }
}
