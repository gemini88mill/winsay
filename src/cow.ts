/**
 * Baseline ASCII cow for winsay (cowsay-style, ASCII-safe).
 */

export const BASELINE_COW = `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`;

/** Return the length of leading whitespace on a line. */
export const getLeadingSpaces = (line: string): number => {
  const m = line.match(/^(\s*)/);
  const leading = m?.[1];
  return leading ? leading.length : 0;
};

/** Dedent: remove minimum leading spaces from each line so relative alignment is preserved. */
const dedent = (str: string): string => {
  const lines = str.split("\n");
  const nonEmpty = lines.filter((l) => /\S/.test(l));
  if (nonEmpty.length === 0) return str.trim();
  const minIndent = Math.min(...nonEmpty.map(getLeadingSpaces));
  return lines.map((l) => (l.length > 0 ? l.slice(minIndent) : l)).join("\n").trim();
};

export const getCow = (): string => dedent(BASELINE_COW);
