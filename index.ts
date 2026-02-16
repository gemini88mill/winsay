#!/usr/bin/env bun
/**
 * winsay - Main entrypoint
 */

import { run } from "./src/cli";

const main = async (): Promise<void> => {
  const code = await run(process.argv.slice(2));
  process.exit(code);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
