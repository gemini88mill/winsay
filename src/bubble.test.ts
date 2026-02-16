import { describe, expect, test } from "bun:test";
import { renderSpeechBubble, renderThoughtBubble } from "./bubble";

describe("renderSpeechBubble", () => {
  test("single line uses < >", () => {
    const out = renderSpeechBubble(["hi"]);
    expect(out).toContain("< hi >");
    expect(out[0]).toBe(" ____");
    expect(out[2]).toBe(" ----");
  });
  test("multi-line first has / \\", () => {
    const out = renderSpeechBubble(["a", "b"]);
    expect(out[1]).toMatch(/\/ .* \\/);
  });
  test("multi-line last has \\ /", () => {
    const out = renderSpeechBubble(["a", "b"]);
    expect(out[2]).toMatch(/\\ .* \//);
  });
  test("pads shorter lines to bubble width", () => {
    const out = renderSpeechBubble(["abc", "x"]);
    expect(out[2]).toBe("\\ x   /");
  });
  test("empty returns empty", () => {
    expect(renderSpeechBubble([])).toEqual([]);
  });
});

describe("renderThoughtBubble", () => {
  test("uses parentheses", () => {
    const out = renderThoughtBubble(["hi"]);
    expect(out[0]).toContain("(");
    expect(out[1]).toContain("( hi )");
  });
});
