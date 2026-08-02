import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { FileTree } from "@/components/FileTree";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const server = setupServer(
  http.get("/api/tree", ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";
    if (path === "") {
      return HttpResponse.json([
        { name: "Projects", path: "Projects", isDirectory: true },
        { name: "Welcome.md", path: "Welcome.md", isDirectory: false },
      ]);
    }
    if (path === "Projects") {
      return HttpResponse.json([
        { name: "Ideas.md", path: "Projects/Ideas.md", isDirectory: false },
      ]);
    }
    return HttpResponse.json([]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("FileTree", () => {
  it("renders root entries from /api/tree", async () => {
    render(<FileTree />);
    expect(await screen.findByText("Welcome.md")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("lazily expands a directory on click", async () => {
    render(<FileTree />);
    const folder = await screen.findByText("Projects");
    fireEvent.click(folder);
    expect(await screen.findByText("Ideas.md")).toBeInTheDocument();
  });
});
