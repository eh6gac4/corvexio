import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { GameNotesView } from "@/app/(games)/games/[slug]/page";
import { GameNotesProvider } from "@/lib/games/useGameNotes";
import type { GameNote } from "@/types/games";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const NOTES: GameNote[] = [
  {
    path: "Games/ark/装備強化.md",
    game: "ark",
    type: "todo",
    status: "todo",
    priority: "should",
    title: "装備強化",
    checklist: [],
  },
  {
    path: "Games/ark/ドラゴン討伐.md",
    game: "ark",
    type: "todo",
    status: "doing",
    priority: "must",
    title: "ドラゴン討伐",
    checklist: [
      { line: 5, depth: 0, checked: true, label: "サドルBP集め" },
      { line: 6, depth: 0, checked: false, label: "拠点強化" },
    ],
  },
  {
    path: "Games/ark/index.md",
    game: "ark",
    type: "index",
    title: "index",
    checklist: [],
  },
  {
    path: "Games/palworld/釣り竿作る.md",
    game: "palworld",
    type: "todo",
    status: "todo",
    title: "釣り竿作る",
    checklist: [],
  },
];

const server = setupServer(
  http.get("/api/games", () => HttpResponse.json(NOTES)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(slug: string) {
  return render(
    <GameNotesProvider>
      <GameNotesView slug={slug} />
    </GameNotesProvider>,
  );
}

describe("GameNotesView", () => {
  it("shows only notes for the given game, excluding index notes", async () => {
    renderPage("ark");

    await waitFor(() => {
      expect(screen.getByText("装備強化")).toBeInTheDocument();
    });
    expect(screen.getByText("ドラゴン討伐")).toBeInTheDocument();
    expect(screen.queryByText("index")).not.toBeInTheDocument();
    expect(screen.queryByText("釣り竿作る")).not.toBeInTheDocument();
  });

  it("filters by status when a status chip is clicked", async () => {
    renderPage("ark");
    await waitFor(() => {
      expect(screen.getByText("装備強化")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "doing" }));

    expect(screen.queryByText("装備強化")).not.toBeInTheDocument();
    expect(screen.getByText("ドラゴン討伐")).toBeInTheDocument();
  });

  it("shows checklist progress on a card that has one", async () => {
    renderPage("ark");
    await waitFor(() => {
      expect(screen.getByText("1/2")).toBeInTheDocument();
    });
  });
});
