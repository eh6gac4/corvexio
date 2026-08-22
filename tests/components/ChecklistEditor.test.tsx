import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChecklistEditor } from "@/components/games/ChecklistEditor";
import type { ChecklistItem } from "@/types/games";

const ITEMS: ChecklistItem[] = [
  { line: 5, depth: 0, checked: false, label: "装備を整える" },
  { line: 6, depth: 1, checked: true, label: "防虫剤" },
];

describe("ChecklistEditor", () => {
  it("calls onToggle with the item's line number when its checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(
      <ChecklistEditor
        items={ITEMS}
        onToggle={onToggle}
        onRelabel={vi.fn()}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onToggle).toHaveBeenCalledWith(5);
  });

  it("calls onRemove with the item's line number when its delete button is clicked", () => {
    const onRemove = vi.fn();
    render(
      <ChecklistEditor
        items={ITEMS}
        onToggle={vi.fn()}
        onRelabel={vi.fn()}
        onRemove={onRemove}
        onAdd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "削除" })[1]);
    expect(onRemove).toHaveBeenCalledWith(6);
  });

  it("commits a relabel on Enter after clicking into edit mode", () => {
    const onRelabel = vi.fn();
    render(
      <ChecklistEditor
        items={ITEMS}
        onToggle={vi.fn()}
        onRelabel={onRelabel}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("装備を整える"));
    const input = screen.getByDisplayValue("装備を整える");
    fireEvent.change(input, { target: { value: "武器を整える" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRelabel).toHaveBeenCalledWith(5, "武器を整える");
  });

  it("calls onAdd with the drafted label and clears the input", () => {
    const onAdd = vi.fn();
    render(
      <ChecklistEditor
        items={ITEMS}
        onToggle={vi.fn()}
        onRelabel={vi.fn()}
        onRemove={vi.fn()}
        onAdd={onAdd}
      />,
    );
    const input = screen.getByPlaceholderText("新しい項目を追加");
    fireEvent.change(input, { target: { value: "新規タスク" } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).toHaveBeenCalledWith("新規タスク");
    expect(input).toHaveValue("");
  });

  it("regression: shows the current item's own label when entering edit mode after another row's removal shifted line numbers onto this key", () => {
    // Before removal: line 5 = "装備を整える", line 6 = "防虫剤".
    const onRelabel = vi.fn();
    const { rerender } = render(
      <ChecklistEditor
        items={ITEMS}
        onToggle={vi.fn()}
        onRelabel={onRelabel}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />,
    );
    // Simulate "装備を整える" (line 5) having been removed: "防虫剤" shifts down
    // to line 5, so React reuses the row previously keyed 5 for this new
    // occupant instead of unmounting/remounting it.
    const AFTER_REMOVAL: ChecklistItem[] = [{ line: 5, depth: 1, checked: true, label: "防虫剤" }];
    rerender(
      <ChecklistEditor
        items={AFTER_REMOVAL}
        onToggle={vi.fn()}
        onRelabel={onRelabel}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("防虫剤"));
    expect(screen.getByDisplayValue("防虫剤")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("装備を整える")).not.toBeInTheDocument();

    // Committing without retyping must not silently relabel this item back
    // to the previous occupant's stale text.
    fireEvent.keyDown(screen.getByDisplayValue("防虫剤"), { key: "Enter" });
    expect(onRelabel).not.toHaveBeenCalled();
  });

  it("ignores an add with a blank/whitespace-only draft", () => {
    const onAdd = vi.fn();
    render(
      <ChecklistEditor
        items={ITEMS}
        onToggle={vi.fn()}
        onRelabel={vi.fn()}
        onRemove={vi.fn()}
        onAdd={onAdd}
      />,
    );
    const input = screen.getByPlaceholderText("新しい項目を追加");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
