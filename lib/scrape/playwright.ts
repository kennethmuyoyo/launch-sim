/**
 * Playwright session helpers. Owner: Ken.
 *
 * Goal: take a URL, return a structured page capture (text + screenshots + links)
 * suitable for an LLM extraction step.
 */

export type PageCapture = {
  url: string;
  finalUrl: string;
  title: string;
  textContent: string;
  htmlSnippet: string; // trimmed HTML (head + main content)
  screenshotBase64: string; // full-page or above-the-fold, your call
  navLinks: { href: string; text: string }[];
  metadata: Record<string, string>; // og:*, twitter:*, description, etc.
};

export async function capturePage(_url: string): Promise<PageCapture> {
  // TODO(ken): implement with playwright
  // const { chromium } = await import("playwright");
  // const browser = await chromium.launch({ headless: true });
  // ...
  throw new Error("capturePage not yet implemented");
}
