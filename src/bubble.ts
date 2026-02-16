/**
 * Speech and thought bubble rendering for winsay.
 */

export type BubbleStyle = "speech" | "thought";

const topBorder = (width: number): string => " " + "_".repeat(width + 2);

const bottomBorder = (width: number): string => " " + "-".repeat(width + 2);

const lineForIndex = (line: string, index: number, total: number): string => {
  if (total === 1) return `< ${line} >`;
  if (index === 0) return `/ ${line} \\`;
  if (index === total - 1) return `\\ ${line} /`;
  return `| ${line} |`;
};

/**
 * Render lines into a speech bubble. Width = longest line length.
 */
export const renderSpeechBubble = (lines: string[]): string[] => {
  if (lines.length === 0) return [];
  const width = Math.max(...lines.map((l) => l.length));
  const paddedLines = lines.map((line) => line.padEnd(width));
  const result: string[] = [topBorder(width)];
  for (let i = 0; i < paddedLines.length; i++) {
    result.push(lineForIndex(paddedLines[i]!, i, paddedLines.length));
  }
  result.push(bottomBorder(width));
  return result;
}

/**
 * Render lines into a thought bubble (parentheses, cowsay-style).
 */
export const renderThoughtBubble = (lines: string[]): string[] => {
  if (lines.length === 0) return [];
  const width = Math.max(...lines.map((l) => l.length));
  const paddedLines = lines.map((line) => line.padEnd(width));
  const top = " (" + "_".repeat(width) + ") ";
  const bottom = " (" + "-".repeat(width) + ") ";

  const result: string[] = [top];
  for (const line of paddedLines) {
    result.push(`( ${line} )`);
  }
  result.push(bottom);
  return result;
}
