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

/** Dedent: remove minimum leading spaces from each line so relative alignment is preserved. */
const dedent = (str: string): string => {
  const lines = str.split("\n");
  const nonEmpty = lines.filter((l) => /\S/.test(l));
  if (nonEmpty.length === 0) return str.trim();
  const minIndent = Math.min(
    ...nonEmpty.map((l) => (l.match(/^(\s*)/)?.[1]?.length ?? 0) as number),
  );
  return lines.map((l) => (l.length > 0 ? l.slice(minIndent) : l)).join("\n").trim();
};

export const getCow = (): string => dedent(BASELINE_COW);
