"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";

// jsdom (used by the component tests) doesn't implement matchMedia, so this
// guards against it being undefined rather than assuming a real browser.
function supportsMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

export function usePrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(
    () => supportsMatchMedia() && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    if (!supportsMatchMedia()) return;
    const mql = window.matchMedia(QUERY);
    const listener = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return prefersDark;
}
