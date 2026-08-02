import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { SearchBox } from "@/components/SearchBox";

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

const server = setupServer(
  http.post("/api/search", async ({ request }) => {
    const body = (await request.json()) as { query: string };
    if (body.query === "idea") {
      return HttpResponse.json([
        {
          path: "Projects/Ideas.md",
          score: 1,
          matches: [{ context: "an idea worth pursuing", start: 3, end: 7 }],
        },
      ]);
    }
    return HttpResponse.json([]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("SearchBox", () => {
  it("shows results after the debounce for a query of 2+ characters", async () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Vaultを検索…");
    fireEvent.change(input, { target: { value: "idea" } });

    await waitFor(
      () => {
        expect(screen.getByText("Projects/Ideas.md")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("does not search for a single-character query", async () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Vaultを検索…");
    fireEvent.change(input, { target: { value: "a" } });

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.queryByText("Projects/Ideas.md")).not.toBeInTheDocument();
  });
});
