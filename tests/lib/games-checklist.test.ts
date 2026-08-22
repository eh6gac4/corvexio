import { describe, expect, it } from "vitest";
import {
  appendChecklistItem,
  parseChecklist,
  removeChecklistLine,
  setChecklistLabel,
  toggleChecklistLine,
} from "@/lib/games/checklist";

const SAMPLE = `---
game: ark
type: todo
status: doing
tags: [game/ark]
---

## メモ

### Checklist
- [ ] 建て替え
- [x] カマキリ
	- [x] 防虫剤 [kamigame.jp](https://kamigame.jp/ARK/アイテム/防虫剤.html)
	- [ ] 至高の棍棒bp　凍土洞窟周回

#### 拠点
- [x] 拠点　橋
`;

describe("parseChecklist", () => {
  it("finds top-level and tab-indented checklist items, ignoring frontmatter and headings", () => {
    const items = parseChecklist(SAMPLE);
    expect(items).toHaveLength(5);
    expect(items[0]).toMatchObject({ depth: 0, checked: false, label: "建て替え" });
    expect(items[1]).toMatchObject({ depth: 0, checked: true, label: "カマキリ" });
    expect(items[2]).toMatchObject({ depth: 1, checked: true });
    expect(items[2].label).toContain("防虫剤");
    expect(items[3]).toMatchObject({ depth: 1, checked: false, label: "至高の棍棒bp　凍土洞窟周回" });
  });

  it("keeps line numbers aligned with the full content (frontmatter included)", () => {
    const items = parseChecklist(SAMPLE);
    const lines = SAMPLE.split("\n");
    for (const item of items) {
      expect(lines[item.line]).toContain(item.checked ? "[x]" : "[ ]");
    }
  });

  it("returns an empty array for a note with no checklist", () => {
    expect(parseChecklist("---\ngame: ark\n---\n\n## メモ\n")).toEqual([]);
  });
});

describe("toggleChecklistLine", () => {
  it("flips an unchecked item to checked, preserving the label and indentation", () => {
    const items = parseChecklist(SAMPLE);
    const target = items.find((item) => item.label === "建て替え")!;
    const updated = toggleChecklistLine(SAMPLE, target.line);
    expect(updated.split("\n")[target.line]).toBe("- [x] 建て替え");
  });

  it("flips a checked, tab-indented item back to unchecked", () => {
    const items = parseChecklist(SAMPLE);
    const target = items.find((item) => item.label.includes("防虫剤"))!;
    const updated = toggleChecklistLine(SAMPLE, target.line);
    const line = updated.split("\n")[target.line];
    expect(line.startsWith("\t- [ ]")).toBe(true);
    expect(line).toContain("防虫剤");
  });

  it("is a no-op for a line index that isn't a checklist item", () => {
    const updated = toggleChecklistLine(SAMPLE, 1); // "game: ark"
    expect(updated).toBe(SAMPLE);
  });

  it("is a no-op for an out-of-range line index", () => {
    const updated = toggleChecklistLine(SAMPLE, 9999);
    expect(updated).toBe(SAMPLE);
  });
});

describe("setChecklistLabel", () => {
  it("replaces the label, keeping indentation and checked state", () => {
    const items = parseChecklist(SAMPLE);
    const target = items.find((item) => item.label.includes("防虫剤"))!;
    const updated = setChecklistLabel(SAMPLE, target.line, "虫よけスプレー");
    const line = updated.split("\n")[target.line];
    expect(line).toBe("\t- [x] 虫よけスプレー");
  });

  it("is a no-op for a line index that isn't a checklist item", () => {
    const updated = setChecklistLabel(SAMPLE, 1, "何か");
    expect(updated).toBe(SAMPLE);
  });
});

describe("removeChecklistLine", () => {
  it("deletes the line outright, shifting subsequent line numbers", () => {
    const items = parseChecklist(SAMPLE);
    const target = items.find((item) => item.label === "建て替え")!;
    const updated = removeChecklistLine(SAMPLE, target.line);
    expect(updated.split("\n")).toHaveLength(SAMPLE.split("\n").length - 1);
    expect(parseChecklist(updated).some((item) => item.label === "建て替え")).toBe(false);
  });

  it("is a no-op for a line index that isn't a checklist item", () => {
    const updated = removeChecklistLine(SAMPLE, 1); // "game: ark"
    expect(updated).toBe(SAMPLE);
  });
});

describe("appendChecklistItem", () => {
  it("inserts a new unchecked item right after the last existing checklist line", () => {
    const updated = appendChecklistItem(SAMPLE, "新しい項目");
    const items = parseChecklist(updated);
    const added = items.find((item) => item.label === "新しい項目");
    expect(added).toMatchObject({ depth: 0, checked: false });
    // lands right after the last item in the original sample ("拠点　橋"), not at EOF
    const lines = updated.split("\n");
    expect(lines[added!.line - 1]).toContain("拠点　橋");
  });

  it("inserts after the `## メモ` heading when the note has no checklist yet", () => {
    const content = "---\ngame: ark\n---\n\n## メモ\n\nsome prose\n";
    const updated = appendChecklistItem(content, "最初の項目");
    const lines = updated.split("\n");
    expect(lines[5]).toBe("- [ ] 最初の項目");
  });

  it("respects the given depth", () => {
    const updated = appendChecklistItem(SAMPLE, "ネスト項目", 1);
    const added = parseChecklist(updated).find((item) => item.label === "ネスト項目");
    expect(added?.depth).toBe(1);
  });
});
