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

export function mathsHtml(t: string, block = false): string {
  return katex.renderToString(t, {
    displayMode: block,
    throwOnError: true,
    output: 'htmlAndMathml',
    // A copy: the renderer writes what an equation defines into the object it is handed.
    macros: { ...MACROS },
    trust: trusted,
    // The two commands are extensions of HTML, which the renderer would warn of at each use.
    strict: (code: string) => (code === 'htmlExtension' ? 'ignore' : 'warn'),
  })
}
