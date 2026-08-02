import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Editor } from "@/components/Editor";

// The real CodeMirror needs DOM measurement APIs jsdom doesn't provide;
// swap it for a plain textarea so we're testing our wiring, not CodeMirror itself.
vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="mock-codemirror"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe("Editor", () => {
  it("renders the current value", async () => {
    render(<Editor value="# Hello" onChange={vi.fn()} />);
    const textarea = await screen.findByTestId("mock-codemirror");
    expect(textarea).toHaveValue("# Hello");
  });

  it("forwards edits via onChange", async () => {
    const handleChange = vi.fn();
    render(<Editor value="" onChange={handleChange} />);
    const textarea = await screen.findByTestId("mock-codemirror");
    fireEvent.change(textarea, { target: { value: "new content" } });
    expect(handleChange).toHaveBeenCalledWith("new content");
  });
});
