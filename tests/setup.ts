import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// The real 'server-only' package throws unless the bundler sets Next's
// "react-server" resolve condition, which Vitest/jsdom never does.
vi.mock("server-only", () => ({}));
