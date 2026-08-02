import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { EditorToolbar } from "@/components/EditorToolbar";

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

describe("EditorToolbar", () => {
  it("matches snapshot for a clean, unsaved-changes-free file", () => {
    const { asFragment } = render(
      <EditorToolbar
        path="Welcome.md"
        dirty={false}
        saving={false}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for a dirty file that is saving", () => {
    const { asFragment } = render(
      <EditorToolbar
        path="Projects/Ideas.md"
        dirty={true}
        saving={true}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
