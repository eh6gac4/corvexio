import { describe, expect, it } from "vitest";
import {
  encodeVaultPath,
  isDirectoryEntry,
  joinVaultPath,
  stripTrailingSlash,
} from "@/lib/obsidian/paths";

describe("encodeVaultPath", () => {
  it("encodes each segment individually, preserving slashes", () => {
    expect(encodeVaultPath("Projects/My Idea.md")).toBe("Projects/My%20Idea.md");
  });

  it("handles unicode segments", () => {
    expect(encodeVaultPath("メモ/日記.md")).toBe(
      `${encodeURIComponent("メモ")}/${encodeURIComponent("日記.md")}`,
    );
  });

  it("drops empty segments from leading/trailing/double slashes", () => {
    expect(encodeVaultPath("/Projects//Ideas.md/")).toBe("Projects/Ideas.md");
  });
});

describe("isDirectoryEntry / stripTrailingSlash", () => {
  it("detects directory entries by trailing slash", () => {
    expect(isDirectoryEntry("Projects/")).toBe(true);
    expect(isDirectoryEntry("Welcome.md")).toBe(false);
  });

  it("strips the trailing slash", () => {
    expect(stripTrailingSlash("Projects/")).toBe("Projects");
    expect(stripTrailingSlash("Welcome.md")).toBe("Welcome.md");
  });
});

describe("joinVaultPath", () => {
  it("joins with a slash when the parent is non-empty", () => {
    expect(joinVaultPath("Projects", "Ideas.md")).toBe("Projects/Ideas.md");
  });

  it("returns the child unchanged when the parent is empty", () => {
    expect(joinVaultPath("", "Welcome.md")).toBe("Welcome.md");
  });
});
