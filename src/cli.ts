#!/usr/bin/env bun
/**
 * winsay - Windows-friendly cowsay CLI
 */

import path from "node:path";
import { wrapText } from "./text";
import { renderSpeechBubble, renderThoughtBubble } from "./bubble";
import { getCow } from "./cow";

const DEFAULT_WRAP = 40;
const MIN_WRAP = 5;
const QUOTES_PATH = path.join(import.meta.dir, "..", "quotes.txt");

const usage = (): string => `winsay - Windows-friendly cowsay

Usage: winsay [options] [message]

Options:
  --wrap <n>   Wrap text to n columns (default: ${DEFAULT_WRAP}, minimum: ${MIN_WRAP})
  --thought    Render thought bubble instead of speech bubble
  -h, --help   Print this usage

If no message is given, reads from stdin. If stdin is empty, picks a random quote from quotes.txt.
Example: echo hi | winsay
`;

const getRandomQuote = async (
  quotesPath: string = QUOTES_PATH,
  readFile: (p: string) => Promise<string> = (p) => Bun.file(p).text(),
): Promise<string> => {
  const content = await readFile(quotesPath).catch(() => {
    throw new Error("quotes file missing or empty");
  });
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("quotes file missing or empty");
  return lines[Math.floor(Math.random() * lines.length)]!;
};

export const getMessage = async (
  args: string[],
  stdinReader?: () => Promise<string>,
  quoteProvider?: () => Promise<string>,
  isTTY?: boolean,
): Promise<string> => {
  const msg = args.join(" ").trim();
  if (msg) return msg;

  const tty = isTTY ?? process.stdin?.isTTY ?? false;
  if (tty) {
    // Interactive TTY: Bun.stdin.text() would block until EOF. Skip stdin and use quote.
    const getQuote = quoteProvider ?? (() => getRandomQuote());
    return await getQuote();
  }

  const read = stdinReader ?? (() => Bun.stdin.text());
  const stdin = await read();
  if (stdin.trim()) return stdin.trim();

  const getQuote = quoteProvider ?? (() => getRandomQuote());
  return await getQuote();
};

type CliIo = {
  log: (line: string) => void;
  error: (line: string) => void;
};

const parseArgs = (argv: string[]): {
  wrap: number;
  thought: boolean;
  help: boolean;
  rest: string[];
} => {
  let wrap = DEFAULT_WRAP;
  let thought = false;
  let help = false;
  const rest: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "-h" || arg === "--help") {
      help = true;
    } else if (arg === "--thought") {
      thought = true;
    } else if (arg === "--wrap") {
      const next = argv[i + 1];
      if (next !== undefined) {
        const n = parseInt(next, 10);
        wrap = Number.isNaN(n) ? DEFAULT_WRAP : Math.max(MIN_WRAP, n);
        i++;
      }
    } else {
      rest.push(arg);
    }
  }

  return { wrap, thought, help, rest };
};

export const run = async (
  argv: string[],
  stdinReader?: () => Promise<string>,
  io: CliIo = {
    log: (line: string) => console.log(line),
    error: (line: string) => console.error(line),
  },
  quoteProvider?: () => Promise<string>,
  isTTY?: boolean,
): Promise<number> => {
  const { wrap, thought, help, rest } = parseArgs(argv);

  if (help) {
    io.log(usage());
    return 0;
  }

  let message: string;
  try {
    message = await getMessage(rest, stdinReader, quoteProvider, isTTY);
  } catch (err) {
    io.error("winsay: " + (err instanceof Error ? err.message : "quotes file missing or empty"));
    return 1;
  }
  if (!message) {
    io.error("winsay: message is empty");
    return 1;
  }

  const lines = wrapText(message, wrap);
  const bubble = thought ? renderThoughtBubble(lines) : renderSpeechBubble(lines);
  const cow = getCow();

  for (const line of bubble) {
    io.log(line);
  }
  io.log(cow);
  return 0;
};

const main = async (): Promise<void> => {
  const code = await run(process.argv.slice(2));
  process.exit(code);
};

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
