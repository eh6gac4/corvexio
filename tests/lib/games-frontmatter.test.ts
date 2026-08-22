import { describe, expect, it } from "vitest";
import { parseFrontmatter, stripWikilink } from "@/lib/games/frontmatter";

describe("parseFrontmatter", () => {
  it("parses a typical Games/ note's frontmatter", () => {
    const content = `---
game: ark
type: todo
status: doing
updated: 2026-08-22
priority: must
next: "[[ユウティラヌス👨👩をテイム]]"
source: https://app.notion.com/p/21fb2c229a574156a8e887c1457cc57e
tags: [game/ark]
---

## メモ

- [ ] 装備を整える
`;
    const { data, body } = parseFrontmatter(content);
    expect(data.game).toBe("ark");
    expect(data.type).toBe("todo");
    expect(data.status).toBe("doing");
    expect(data.priority).toBe("must");
    expect(data.next).toBe("[[ユウティラヌス👨👩をテイム]]");
    expect(data.tags).toEqual(["game/ark"]);
    expect(body.trim().startsWith("## メモ")).toBe(true);
  });

  it("treats an empty scalar (e.g. `platform:`) as unset rather than an empty string", () => {
    const content = `---
game: ark
type: index
platform:
updated: 2026-08-22
---

## 進行状況
`;
    const { data } = parseFrontmatter(content);
    expect(data.platform).toBeUndefined();
  });

  it("falls back to an empty data object when there is no frontmatter block", () => {
    const content = "just a plain note, no frontmatter";
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({});
    expect(body).toBe(content);
  });
});

describe("stripWikilink", () => {
  it("strips [[...]] wrapping", () => {
    expect(stripWikilink("[[ユウティラヌス👨👩をテイム]]")).toBe("ユウティラヌス👨👩をテイム");
  });

  it("leaves a plain string unchanged", () => {
    expect(stripWikilink("https://example.com")).toBe("https://example.com");
  });
});
