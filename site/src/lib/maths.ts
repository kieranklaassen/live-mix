// An equation as HTML, set when the site is built, with the two commands a lesson adds to the
// mathematics.
import katex from 'katex'
import { ROLES } from '../figures/roles.ts'

const MACROS = {
  // \sig{out}{G(x)}: the term in the colour of that role's line in the figures.
  '\\sig': '\\htmlClass{sig-#1}{#2}',
  // \at{pole-coeff}{a}: the term links to the line of the listing `pole` that has the key
  // `coeff` (Listing's `at`). In a macro's body two hashes are one, so the three here are the
  // hash of the link and the first argument.
  '\\at': '\\href{###1}{#2}',
}

const ROLE_CLASSES: readonly string[] = ROLES.map((role) => `sig-${role}`)

/**
 * What the two commands come to, and nothing else. The renderer writes a command it is not let
 * to run as red text and reports nothing, so a refusal here throws and stops the build.
 */
function trusted(context: { command: string; class?: string; url?: string }): boolean {
  const { command } = context
  if (command === '\\htmlClass' && ROLE_CLASSES.includes(context.class ?? '')) return true
  if (command === '\\href' && context.url?.startsWith('#')) {
    // A line's number moves when its file does, and nothing would say the link now points at
    // another line. A line is linked by a key its listing gives it, found by the line's text.
    if (/-L\d+$/.test(context.url)) {
      throw new Error(
        `An equation links to "${context.url.slice(1)}", a line by its number. Give the line a ` +
          `key on its listing, <Listing name="pole" at={{ coeff: 'text on the line' }} />, and ` +
          `link to it by the key: \\at{pole-coeff}{term}.`,
      )
    }
    return true
  }
  const what = context.class ?? context.url
  throw new Error(
    `An equation uses ${command}${what ? ` with "${what}"` : ''}. ` +
      `It may colour a term by its role, \\sig{role}{term} with one of ${ROLES.join(', ')}, ` +
      `and link a term to a keyed line of a listing, \\at{name-key}{term}.`,
  )
}

/**
 * The renderer's HTML with no link inside a link. `\at{a}{\frac{\at{b}{x}}{y}}` comes out of the
 * renderer as a link that holds a link, which HTML does not have: a browser ends the outer one
 * where the inner one starts, and the fraction they held is drawn apart. So a link that holds
 * another is taken off its term and put on each piece of text in the term that has no nearer
 * link of its own: the inner term still goes to its own line, and the rest of the outer term
 * to the outer one's. An equation with no link inside a link comes back as it was.
 */
export function unnestLinks(html: string): string {
  // A link's own tag, with whether it closes and what it carries; any other tag; or text.
  const tokens = [...html.matchAll(/<(\/?)a\b([^>]*)>|<[^>]*>|[^<]+/g)]
  // Which links hold another: the ones still open where a link opens.
  const holds = new Set<number>()
  const open: number[] = []
  tokens.forEach(([, closing], index) => {
    if (closing === undefined) return
    if (closing) open.pop()
    else {
      for (const outer of open) holds.add(outer)
      open.push(index)
    }
  })
  if (holds.size === 0) return html

  /** The links open at this point, the nearest last: its address, and whether it holds another. */
  const round: { href: string; split: boolean }[] = []
  return tokens
    .map(([token, closing, attributes], index) => {
      if (!token.startsWith('<')) {
        const near = round.at(-1)
        // Text that only keeps a line's height (a space of no width) is nothing to press.
        return near?.split && /[^\s\u200b]/.test(token)
          ? `<a href="${near.href}">${token}</a>`
          : token
      }
      if (closing === undefined) return token
      if (closing) return round.pop()!.split ? '</span>' : token
      const split = holds.has(index)
      round.push({ href: /\bhref="([^"]*)"/.exec(attributes!)?.[1] ?? '', split })
      return split ? `<span${attributes!.replace(/\s*\bhref="[^"]*"/, '')}>` : token
    })
    .join('')
}

export function mathsHtml(t: string, block = false): string {
  const html = katex.renderToString(t, {
    displayMode: block,
    throwOnError: true,
    output: 'htmlAndMathml',
    // A copy: the renderer writes what an equation defines into the object it is handed.
    macros: { ...MACROS },
    trust: trusted,
    // The two commands are extensions of HTML, which the renderer would warn of at each use.
    strict: (code: string) => (code === 'htmlExtension' ? 'ignore' : 'warn'),
  })
  // The search reads none of it: the renderer writes every term three times (as MathML, as the
  // source, as what is shown), which a search takes for words such as "qqq" and shows in its
  // excerpts, and a letter alone answers a search for any word that starts with it.
  return unnestLinks(html).replace(/^<span /, '<span data-pagefind-ignore ')
}
