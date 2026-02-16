import { describe, expect, test } from "bun:test";
import { getCow } from "./cow";

describe("getCow", () => {
  test("returns cow with baseline ASCII art", () => {
    const cow = getCow();
    expect(cow).toContain("^__^");
    expect(cow).toContain("(oo)");
    expect(cow).toContain("||----w");
  });

  test("cow lines are consistently aligned (no first-line offset)", () => {
    const cow = getCow();
    const lines = cow.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const firstLineSpaces = (lines[0]!.match(/^(\s*)/)?.[1]?.length ?? 0) as number;
    const secondLineSpaces = (lines[1]!.match(/^(\s*)/)?.[1]?.length ?? 0) as number;
    expect(secondLineSpaces - firstLineSpaces).toBeLessThanOrEqual(2);
  });
});
