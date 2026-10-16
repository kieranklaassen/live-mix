// What went wrong, in words the page can show.

/** An error's own message; anything else that was thrown, as text. */
export const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
