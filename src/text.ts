/**
 * Text normalization and wrapping for winsay.
 */

/** Normalize line endings: \r\n and \r -> \n */
export const normalizeNewlines = (text: string): string =>
  text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

/**
 * Wrap text to the given column width.
 * Preserves explicit newlines and never drops content.
 * Returns array of lines padded to a consistent width.
 */
export const wrapText = (text: string, width: number): string[] => {
  if (width < 1) width = 1;
  const normalized = normalizeNewlines(text).trim();
  if (!normalized) return [];

  const lines: string[] = [];
  const sourceLines = normalized.split("\n");

  for (const sourceLine of sourceLines) {
    const trimmed = sourceLine.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = "";

    for (const word of words) {
      if (word.length > width) {
        if (current) {
          lines.push(current);
          current = "";
        }
        for (let i = 0; i < word.length; i += width) {
          lines.push(word.slice(i, i + width));
        }
        continue;
      }

      const next = current ? `${current} ${word}` : word;
      if (next.length <= width) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
  }

  const maxLen = lines.length > 0 ? Math.max(...lines.map((l) => l.length)) : 0;
  return lines.map((l) => l.padEnd(maxLen));
}
