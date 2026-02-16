import { describe, expect, test } from "bun:test";
import { normalizeNewlines, wrapText } from "./text";

describe("normalizeNewlines", () => {
  test("leaves \\n unchanged", () => {
    expect(normalizeNewlines("a\nb")).toBe("a\nb");
  });
  test("converts \\r\\n to \\n", () => {
    expect(normalizeNewlines("a\r\nb")).toBe("a\nb");
  });
  test("converts \\r to \\n", () => {
    expect(normalizeNewlines("a\rb")).toBe("a\nb");
  });
});

describe("wrapText", () => {
  test("wraps at width", () => {
    expect(wrapText("hello world", 5)).toEqual(["hello", "world"]);
  });
  test("single word under width stays one line", () => {
    expect(wrapText("hi", 40)).toEqual(["hi"]);
  });
  test("pads lines to longest", () => {
    const out = wrapText("a bb ccc dddd", 5);
    expect(out.length).toBeGreaterThanOrEqual(2);
    const maxLen = Math.max(...out.map((l) => l.length));
    expect(out.every((l) => l.length === maxLen)).toBe(true);
  });
  test("long words are preserved without truncation", () => {
    expect(wrapText("abcdef", 4)).toEqual(["abcd", "ef  "]);
  });
  test("preserves explicit line breaks", () => {
    expect(wrapText("a\nb", 10)).toEqual(["a", "b"]);
  });
  test("empty input returns empty", () => {
    expect(wrapText("", 40)).toEqual([]);
    expect(wrapText("   ", 40)).toEqual([]);
  });
});
