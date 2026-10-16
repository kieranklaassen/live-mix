// The colours of code, for a listing and for fenced code in the docs. Each is one of the page's
// own variables (src/styles/site.css, "listing colours"), so code follows the page's scheme.
export const codeTheme = {
  name: 'lm-code',
  type: 'light' as const,
  // The first entry is the text and the ground. They are not given under `colors` as well: the
  // highlighter writes into that object, and the theme is one object for every page.
  settings: [
    { settings: { foreground: 'var(--code-text)', background: 'var(--code-bg)' } },
    { scope: ['comment'], settings: { foreground: 'var(--code-comment)' } },
    {
      scope: ['keyword', 'storage', 'variable.language'],
      settings: { foreground: 'var(--code-keyword)' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'keyword.other.unit'],
      settings: { foreground: 'var(--code-number)' },
    },
    { scope: ['string'], settings: { foreground: 'var(--code-string)' } },
    {
      scope: ['entity.name.function', 'support.function'],
      settings: { foreground: 'var(--code-function)' },
    },
    {
      scope: ['entity.name.type', 'entity.name.namespace', 'support.type', 'support.class'],
      settings: { foreground: 'var(--code-type)' },
    },
    {
      scope: [
        'meta.preprocessor',
        'keyword.control.directive',
        'entity.name.function.preprocessor',
      ],
      settings: { foreground: 'var(--code-directive)' },
    },
  ],
}
