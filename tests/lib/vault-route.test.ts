import { describe, expect, it } from "vitest";
import { decodeEditPath, editHref } from "@/lib/vault-route";

describe("editHref", () => {
  it("encodes each segment individually, preserving slashes", () => {
    expect(editHref("Projects/My Idea.md")).toBe("/edit/Projects/My%20Idea.md");
  });

  it("handles unicode segments", () => {
    expect(editHref("メモ/日記.md")).toBe(
      `/edit/${encodeURIComponent("メモ")}/${encodeURIComponent("日記.md")}`,
    );
  });
});

describe("decodeEditPath", () => {
  it("round-trips editHref's encoding back to the original path", () => {
    const original = "Notes/Tailwind JIT の content スキャン漏れ.md";
    const segments = original.split("/").map(encodeURIComponent);
    expect(decodeEditPath(segments)).toBe(original);
  });

  it("falls back to the raw segment on an invalid percent-encoding", () => {
    expect(decodeEditPath(["100%.md"])).toBe("100%.md");
  });
});
