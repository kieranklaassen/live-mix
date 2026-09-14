// OSC 1.0 address pattern matching: `?` one character, `*` any run, `[abc]`
// / `[a-z]` / `[!a]` character classes, `{foo,bar}` alternatives; none of them
// cross a `/`. A pattern with no special characters is an exact address.

const SPECIAL = /[?*[{]/

const cache = new Map<string, RegExp | null>()

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Translate an OSC pattern into a RegExp, or null when the pattern is malformed. */
export function oscPatternToRegExp(pattern: string): RegExp | null {
  let out = '^'
  let index = 0
  while (index < pattern.length) {
    const char = pattern[index]
    switch (char) {
      case '?':
        out += '[^/]'
        index += 1
        break
      case '*':
        out += '[^/]*'
        index += 1
        break
      case '[': {
        const close = pattern.indexOf(']', index + 1)
        if (close === -1) return null
        let body = pattern.slice(index + 1, close)
        let negate = false
        if (body.startsWith('!')) {
          negate = true
          body = body.slice(1)
        }
        if (body.length === 0) return null
        // Ranges keep their dash; everything else is escaped.
        const cls = body.replace(/[\\\]^]/g, '\\$&')
        out += `[${negate ? '^' : ''}${cls}]`
        index = close + 1
        break
      }
      case '{': {
        const close = pattern.indexOf('}', index + 1)
        if (close === -1) return null
        const alternatives = pattern
          .slice(index + 1, close)
          .split(',')
          .map((alternative) => escapeRegExp(alternative))
        out += `(?:${alternatives.join('|')})`
        index = close + 1
        break
      }
      case ']':
      case '}':
        return null
      default:
        out += escapeRegExp(char)
        index += 1
    }
  }
  out += '$'
  try {
    return new RegExp(out)
  } catch {
    return null
  }
}

/** Does the concrete `address` fall under `pattern`? Malformed patterns match nothing. */
export function matchOscAddress(pattern: string, address: string): boolean {
  if (!SPECIAL.test(pattern)) return pattern === address
  let regexp = cache.get(pattern)
  if (regexp === undefined) {
    regexp = oscPatternToRegExp(pattern)
    if (cache.size > 512) cache.clear()
    cache.set(pattern, regexp)
  }
  return regexp?.test(address) ?? false
}

/** True when the string contains OSC pattern characters. */
export function isOscPattern(address: string): boolean {
  return SPECIAL.test(address)
}
