import { describe, expect, it } from "vitest";
import { decodeGameNotePath, gameNoteHref, noteTitle } from "@/lib/games/notes";

describe("gameNoteHref / decodeGameNotePath round trip", () => {
  it("round-trips a plain ascii filename", () => {
    const href = gameNoteHref("ark", "Games/ark/gear.md");
    const [, , slug, note] = href.split("/");
    expect(decodeGameNotePath(slug, note)).toBe("Games/ark/gear.md");
  });

  it("round-trips unicode filenames with spaces and emoji (regression: real vault notes 404'd in production until this decode was restored)", () => {
    const path = "Games/ark/TEKステゴ👩をテイム.md";
    const href = gameNoteHref("ark", path);
    const [, , slug, note] = href.split("/");
    expect(decodeGameNotePath(slug, note)).toBe(path);
  });

  it("round-trips a filename containing a literal space", () => {
    const path = "Games/ark/アルゲンタヴィスをテイム 2.md";
    const href = gameNoteHref("ark", path);
    const [, , slug, note] = href.split("/");
    expect(decodeGameNotePath(slug, note)).toBe(path);
  });

  it("falls back to the raw segment on an invalid percent-encoding", () => {
    expect(decodeGameNotePath("ark", "100%.md")).toBe("Games/ark/100%.md");
  });
});

describe("noteTitle", () => {
  it("strips the .md extension from the filename", () => {
    expect(noteTitle("Games/ark/ドラゴン討伐.md")).toBe("ドラゴン討伐");
  });
});
