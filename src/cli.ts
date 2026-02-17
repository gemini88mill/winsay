#!/usr/bin/env bun
/**
 * winsay - CLI helper actions
 */

import path from "node:path";
import { wrapText } from "./text";
import { renderSpeechBubble, renderThoughtBubble } from "./bubble";
import { getCow } from "./cow";

export const DEFAULT_WRAP = 40;
export const MIN_WRAP = 5;
export const QUOTES_PATH = path.join(import.meta.dir, "..", "quotes.txt");

export type Quote = { text: string; speaker?: string };

const parseQuoteLine = (line: string): Quote => {
  const i = line.indexOf("|");
  if (i < 0) return { text: line };
  return { text: line.slice(0, i).trim(), speaker: line.slice(i + 1).trim() || undefined };
};

export const getRandomQuote = async (
  quotesPath: string = QUOTES_PATH,
  readFile: (p: string) => Promise<string> = (p) => Bun.file(p).text(),
): Promise<Quote> => {
  const content = await readFile(quotesPath).catch(() => {
    throw new Error("quotes file missing or empty");
  });
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("quotes file missing or empty");
  return parseQuoteLine(lines[Math.floor(Math.random() * lines.length)]!);
};

const normalizeQuote = (q: Quote | string): Quote =>
  typeof q === "string" ? { text: q } : q;

export const getMessage = async (
  args: string[],
  stdinReader?: () => Promise<string>,
  quoteProvider?: () => Promise<Quote | string>,
  isTTY?: boolean,
): Promise<Quote> => {
  const msg = args.join(" ").trim();
  if (msg) return { text: msg };

  const tty = isTTY ?? process.stdin?.isTTY ?? false;
  if (tty) {
    const getQuote = quoteProvider ?? (() => getRandomQuote());
    return normalizeQuote(await getQuote());
  }

  const read = stdinReader ?? (() => Bun.stdin.text());
  const stdin = await read();
  if (stdin.trim()) return { text: stdin.trim() };

  const getQuote = quoteProvider ?? (() => getRandomQuote());
  return normalizeQuote(await getQuote());
};

export type CliIo = {
  log: (line: string) => void;
  error: (line: string) => void;
};

export const getErrorCode = (e: unknown): string | undefined => {
  if (e === null || typeof e !== "object" || !("code" in e)) return undefined;
  const v = (e as Record<string, unknown>).code;
  return typeof v === "string" ? v : undefined;
};

export const parseWrap = (value: string): number => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return DEFAULT_WRAP;
  return Math.max(MIN_WRAP, n);
};

export type ParsedOpts = {
  wrap: number;
  thought: boolean;
};

/**
 * Testable entrypoint: parses argv (without Commander), then runs executeFromParsed.
 * Commander lives in index.ts; this provides the same run(argv, ...) API for tests.
 */
const parseArgv = (argv: string[]): { wrap: number; thought: boolean; args: string[] } => {
  let wrap = DEFAULT_WRAP;
  let thought = false;
  const args: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) continue;
    const next = argv[i + 1];
    if (a === "--wrap" && typeof next === "string") {
      wrap = parseWrap(next);
      i++;
    } else if (a === "--thought") {
      thought = true;
    } else if (a !== "--help" && !a.startsWith("-")) {
      args.push(a);
    }
  }
  return { wrap, thought, args };
};

export const run = async (
  argv: string[],
  stdinReader?: () => Promise<string>,
  io: CliIo = { log: (l) => console.log(l), error: (l) => console.error(l) },
  quoteProvider?: () => Promise<Quote | string>,
  isTTY?: boolean,
): Promise<number> => {
  if (argv.includes("--help")) {
    io.log("Usage: winsay [options] [message...]");
    io.log("");
    io.log("Options:");
    io.log(`  --wrap <n>    Wrap text to n columns (default: ${DEFAULT_WRAP}, minimum: ${MIN_WRAP})`);
    io.log("  --thought     Render thought bubble instead of speech bubble");
    return 0;
  }
  const { wrap, thought, args } = parseArgv(argv);
  return executeFromParsed({ wrap, thought }, args, io, stdinReader, quoteProvider, isTTY);
};

export const executeFromParsed = async (
  opts: ParsedOpts,
  args: string[],
  io: CliIo,
  stdinReader?: () => Promise<string>,
  quoteProvider?: () => Promise<Quote | string>,
  isTTY?: boolean,
): Promise<number> => {
  let quote: Quote;
  try {
    quote = await getMessage(args, stdinReader, quoteProvider, isTTY);
  } catch (err) {
    io.error("winsay: " + (err instanceof Error ? err.message : "quotes file missing or empty"));
    return 1;
  }
  if (!quote.text) {
    io.error("winsay: message is empty");
    return 1;
  }

  const wrap = opts.wrap;
  const thought = opts.thought;
  let lines = wrapText(quote.text, wrap);
  if (quote.speaker) {
    lines = [...lines, `— ${quote.speaker}`];
  }
  const bubble = thought ? renderThoughtBubble(lines) : renderSpeechBubble(lines);
  const cow = getCow();

  for (const line of bubble) {
    io.log(line);
  }
  io.log(cow);
  return 0;
};
