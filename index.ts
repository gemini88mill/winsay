#!/usr/bin/env bun
/**
 * winsay - Main entrypoint (Commander.js CLI)
 */

import { Command } from "commander";
import {
  getErrorCode,
  executeFromParsed,
  parseWrap,
  DEFAULT_WRAP,
  MIN_WRAP,
  type CliIo,
} from "./src/cli";

const io: CliIo = {
  log: (line: string) => console.log(line),
  error: (line: string) => console.error(line),
};

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

const main = async (): Promise<void> => {
  try {
    program.parse(process.argv.slice(2), { from: "user" });
  } catch (err: unknown) {
    if (getErrorCode(err) === "commander.helpDisplayed") {
      process.exit(0);
    }
    throw err;
  }

  const opts = program.opts();
  const args = program.args;
  const wrap = typeof opts.wrap === "number" ? opts.wrap : DEFAULT_WRAP;
  const thought = opts.thought === true;
  const code = await executeFromParsed({ wrap, thought }, args, io);
  process.exit(code);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
