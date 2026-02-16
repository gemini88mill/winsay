#!/usr/bin/env bun
/**
 * winsay - Windows-friendly cowsay CLI
 */

import path from "node:path";
import { Command } from "commander";
import { wrapText } from "./text";
import { renderSpeechBubble, renderThoughtBubble } from "./bubble";
import { getCow } from "./cow";

const DEFAULT_WRAP = 40;
const MIN_WRAP = 5;
const QUOTES_PATH = path.join(import.meta.dir, "..", "quotes.txt");

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

const getErrorCode = (e: unknown): string | undefined => {
  if (e === null || typeof e !== "object" || !("code" in e)) return undefined;
  const v = (e as Record<string, unknown>).code;
  return typeof v === "string" ? v : undefined;
};

const parseWrap = (value: string): number => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return DEFAULT_WRAP;
  return Math.max(MIN_WRAP, n);
};

const createProgram = (io: CliIo): Command => {
  const program = new Command();
  program
    .name("winsay")
    .description("Windows-friendly cowsay")
    .option("--wrap <n>", `Wrap text to n columns (default: ${DEFAULT_WRAP}, minimum: ${MIN_WRAP})`, parseWrap, DEFAULT_WRAP)
    .option("--thought", "Render thought bubble instead of speech bubble")
    .argument("[message...]", "Message to display; if omitted, reads from stdin or picks a random quote");
  program.configureOutput({
    writeOut: (str) => io.log(str),
    writeErr: (str) => io.error(str),
  });
  program.exitOverride();
  return program;
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
  const program = createProgram(io);
  try {
    program.parse(argv, { from: "user" });
  } catch (err: unknown) {
    if (getErrorCode(err) === "commander.helpDisplayed") return 0;
    throw err;
  }

  const opts = program.opts();
  const rest = program.args;

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

  const wrap = typeof opts.wrap === "number" ? opts.wrap : DEFAULT_WRAP;
  const thought = opts.thought === true;
  const lines = wrapText(message, wrap);
  const bubble = thought ? renderThoughtBubble(lines) : renderSpeechBubble(lines);
  const cow = getCow();

  for (const line of bubble) {
    io.log(line);
  }
  io.log(cow);
  return 0;
};
