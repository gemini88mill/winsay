import { describe, expect, test } from "bun:test";
import { run } from "./cli";

describe("cli", () => {
  test("prints message in bubble", async () => {
    const logs: string[] = [];
    const errors: string[] = [];
    const code = await run(["hello"], undefined, {
      log: (line) => logs.push(line),
      error: (line) => errors.push(line),
    });

    const stdout = logs.join("\n");
    expect(code).toBe(0);
    expect(stdout).toContain("hello");
    expect(stdout).toContain("<");
    expect(stdout).toContain(">");
    expect(errors).toEqual([]);
  });

  test("stdin fallback (when no args, piped)", async () => {
    const logs: string[] = [];
    const code = await run(
      [],
      () => Promise.resolve("hi from stdin"),
      { log: (line) => logs.push(line), error: () => {} },
      undefined,
      false,
    );
    expect(code).toBe(0);
    expect(logs.join("\n")).toContain("hi from stdin");
  });

  test("empty input exits 1", async () => {
    const errors: string[] = [];
    const code = await run(
      [],
      () => Promise.resolve(""),
      {
        log: () => {},
        error: (line) => errors.push(line),
      },
      () => Promise.reject(new Error("quotes file missing or empty")),
      false,
    );
    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("quotes file missing or empty");
  });

  test("random quote fallback when no args and empty stdin (piped)", async () => {
    const logs: string[] = [];
    const FIXED_QUOTE = "Don't Panic.";
    const code = await run(
      [],
      () => Promise.resolve(""),
      {
        log: (line) => logs.push(line),
        error: () => {},
      },
      () => Promise.resolve(FIXED_QUOTE),
      false, // piped stdin, empty -> use quote
    );
    expect(code).toBe(0);
    expect(logs.join("\n")).toContain(FIXED_QUOTE);
  });

  test("random quote with attribution displays speaker in bubble", async () => {
    const logs: string[] = [];
    const code = await run(
      [],
      () => Promise.resolve(""),
      {
        log: (line) => logs.push(line),
        error: () => {},
      },
      () => Promise.resolve({ text: "Don't Panic.", speaker: "The Hitchhiker's Guide" }),
      false,
    );
    expect(code).toBe(0);
    const output = logs.join("\n");
    expect(output).toContain("Don't Panic.");
    expect(output).toContain("— The Hitchhiker's Guide");
    // Speaker must be inside the bubble (before the cow), not after
    const cowIndex = output.indexOf("\\   ^__^");
    const speakerIndex = output.indexOf("— The Hitchhiker's Guide");
    expect(cowIndex).toBeGreaterThan(speakerIndex);
  });

  test("interactive TTY with no args uses quote (skips stdin, no hang)", async () => {
    const logs: string[] = [];
    const FIXED_QUOTE = "The Answer is 42.";
    let stdinRead = false;
    const code = await run(
      [],
      () => {
        stdinRead = true;
        return Promise.resolve("");
      },
      {
        log: (line) => logs.push(line),
        error: () => {},
      },
      () => Promise.resolve(FIXED_QUOTE),
      true, // isTTY: interactive -> skip stdin, use quote
    );
    expect(code).toBe(0);
    expect(logs.join("\n")).toContain(FIXED_QUOTE);
    expect(stdinRead).toBe(false); // stdin must not be read in TTY mode
  });

  test("stdin still wins over random quote (piped stdin)", async () => {
    const logs: string[] = [];
    const code = await run(
      [],
      () => Promise.resolve("hi from stdin"),
      {
        log: (line) => logs.push(line),
        error: () => {},
      },
      () => Promise.resolve("Don't Panic."),
      false, // piped stdin -> read and use
    );
    expect(code).toBe(0);
    expect(logs.join("\n")).toContain("hi from stdin");
    expect(logs.join("\n")).not.toContain("Don't Panic.");
  });

  test("error path when quote provider throws (file missing/empty)", async () => {
    const errors: string[] = [];
    const code = await run(
      [],
      () => Promise.resolve(""),
      {
        log: () => {},
        error: (line) => errors.push(line),
      },
      () => Promise.reject(new Error("quotes file missing or empty")),
      false,
    );
    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("quotes file missing or empty");
  });

  test("--help prints usage", async () => {
    const logs: string[] = [];
    const code = await run(["--help"], undefined, {
      log: (line) => logs.push(line),
      error: () => {},
    });
    const stdout = logs.join("\n");
    expect(code).toBe(0);
    expect(stdout).toContain("winsay");
    expect(stdout).toContain("--wrap");
    expect(stdout).toContain("--thought");
  });

  test("--wrap affects output", async () => {
    const logs: string[] = [];
    const code = await run(["--wrap", "10", "one two three four"], undefined, {
      log: (line) => logs.push(line),
      error: () => {},
    });
    const stdout = logs.join("\n");
    expect(code).toBe(0);
    expect(stdout).toContain("one two");
    expect(stdout).toContain("three");
    expect(stdout).toContain("four");
  });

  test("--wrap minimum enforced", async () => {
    const logs: string[] = [];
    const code = await run(["--wrap", "3", "ab cd ef"], undefined, {
      log: (line) => logs.push(line),
      error: () => {},
    });
    const stdout = logs.join("\n");
    expect(code).toBe(0);
    // wrap 3 would break "ab cd" across lines; min 5 keeps "ab cd" on one line
    expect(stdout).toContain("ab cd");
  });

  test("--thought renders thought bubble", async () => {
    const logs: string[] = [];
    const code = await run(["--thought", "think"], undefined, {
      log: (line) => logs.push(line),
      error: () => {},
    });
    const stdout = logs.join("\n");
    expect(code).toBe(0);
    expect(stdout).toContain("think");
    expect(stdout).toContain("(");
    expect(stdout).not.toContain("<");
  });
});
