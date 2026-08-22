import { describe, expect, it } from "vitest";
import { parseChecklist, toggleChecklistLine } from "@/lib/games/checklist";

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
