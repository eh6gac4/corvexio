import { describe, expect, it } from "vitest";
import {
  buildNoteTemplate,
  parseFrontmatter,
  setFrontmatterField,
  stripWikilink,
} from "@/lib/games/frontmatter";

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

describe("setFrontmatterField", () => {
  const content = `---
game: ark
type: todo
status: doing
priority: must
next: "[[ユウティラヌス👨👩をテイム]]"
tags: [game/ark]
---

## メモ

- [ ] 装備を整える
`;

  it("replaces an existing key's line only, leaving every other line untouched", () => {
    const updated = setFrontmatterField(content, "status", "done");
    const lines = updated.split("\n");
    expect(lines[3]).toBe("status: done");
    // every other line, including the body, is byte-for-byte unchanged
    const originalLines = content.split("\n");
    lines.forEach((line, index) => {
      if (index !== 3) expect(line).toBe(originalLines[index]);
    });
  });

  it("appends a missing key at the end of the frontmatter block", () => {
    const updated = setFrontmatterField(content, "source", "https://example.com");
    const { data } = parseFrontmatter(updated);
    expect(data.source).toBe("https://example.com");
    expect(data.game).toBe("ark"); // existing keys untouched
  });

  it("prepends a new frontmatter block when the note has none", () => {
    const updated = setFrontmatterField("plain note body", "status", "todo");
    const { data, body } = parseFrontmatter(updated);
    expect(data.status).toBe("todo");
    expect(body).toBe("plain note body");
  });
});

describe("buildNoteTemplate", () => {
  it("builds a frontmatter block + heading matching the vault's Games/ schema", () => {
    const note = buildNoteTemplate({ game: "ark", type: "todo", status: "todo", priority: "should", title: "新しい攻略メモ" });
    const { data, body } = parseFrontmatter(note);
    expect(data.game).toBe("ark");
    expect(data.type).toBe("todo");
    expect(data.status).toBe("todo");
    expect(data.priority).toBe("should");
    expect(data.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body).toContain("# 新しい攻略メモ");
    expect(body).toContain("## メモ");
  });

  it("omits status/priority lines when not provided", () => {
    const note = buildNoteTemplate({ game: "palworld", type: "info", title: "index" });
    const { data } = parseFrontmatter(note);
    expect(data.status).toBeUndefined();
    expect(data.priority).toBeUndefined();
  });
});
