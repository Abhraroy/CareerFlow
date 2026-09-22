/**
 * Shared utility to clean job description text scraped from job portals.
 */
export function cleanJobText(text: string): string {
  if (!text) return ''

  return (
    text
      // 1. Replace newlines, carriage returns, and underscores with a space
      .replace(/[\r\n_]+/g, ' ')
      // 2. Remove special characters (keep Unicode letters/numbers, whitespace, currency symbols \p{Sc}, hyphens, colons, slashes, periods, commas)
      .replace(/[^\p{L}\p{N}\s\p{Sc}\-:\/.,]/gu, '')
      // 3. Normalize multiple whitespace characters into a single space
      .replace(/\s+/g, ' ')
      .trim()
  )
}
