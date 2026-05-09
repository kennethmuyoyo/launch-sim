/**
 * Playwright session helpers. Owner: Ken.
 *
 * Loads a URL, captures a structured page dump suitable for downstream extraction
 * (text, screenshot, nav links, og metadata).
 */

import { chromium, type Browser } from "playwright";

export type NavLink = { href: string; text: string };

export type PageCapture = {
  url: string;
  finalUrl: string;
  title: string;
  textContent: string;
  htmlSnippet: string;
  screenshotDataUrl: string; // data:image/jpeg;base64,...
  navLinks: NavLink[];
  metadata: Record<string, string>; // og:*, twitter:*, description, etc.
  headings: { h1: string[]; h2: string[]; h3: string[] };
  buttons: string[]; // visible button / CTA-shaped link text
  blocked: boolean;  // true if the page looked like a captcha/CF challenge
};

const NAV_TIMEOUT_MS = 25_000;
const SETTLE_MS = 1_000;

let cached: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (cached) return cached;
  cached = await chromium.launch({ headless: true });
  return cached;
}

export async function capturePage(url: string): Promise<PageCapture> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
  } catch {
    // Some sites never go fully idle (analytics, websockets). Fall back to domcontentloaded.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
  }
  await page.waitForTimeout(SETTLE_MS);

  const finalUrl = page.url();
  const title = await page.title();

  const blocked = /just a moment|attention required|verify you are human|cf-browser-verification/i.test(
    (await page.content()).slice(0, 4000),
  );

  const screenshotBuffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: false });
  const screenshotDataUrl = `data:image/jpeg;base64,${screenshotBuffer.toString("base64")}`;

  const dump = await page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    const headSnippet = document.head?.outerHTML?.slice(0, 8_000) ?? "";
    const bodySnippet = document.body?.innerHTML?.slice(0, 12_000) ?? "";

    const meta: Record<string, string> = {};
    document.querySelectorAll("meta").forEach((m) => {
      const key = m.getAttribute("property") ?? m.getAttribute("name");
      const value = m.getAttribute("content");
      if (key && value) meta[key] = value;
    });

    const headings = {
      h1: Array.from(document.querySelectorAll("h1")).map((n) => (n.textContent ?? "").trim()).filter(Boolean),
      h2: Array.from(document.querySelectorAll("h2")).map((n) => (n.textContent ?? "").trim()).filter(Boolean),
      h3: Array.from(document.querySelectorAll("h3")).map((n) => (n.textContent ?? "").trim()).filter(Boolean),
    };

    const buttons: string[] = [];
    document.querySelectorAll("button, a[role='button'], a.btn, a[class*='button' i], a[class*='cta' i]").forEach((el) => {
      const t = (el.textContent ?? "").trim().replace(/\s+/g, " ");
      if (t && t.length < 60) buttons.push(t);
    });

    const links: { href: string; text: string }[] = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const t = (a.textContent ?? "").trim().replace(/\s+/g, " ");
      if (href && t && t.length < 80) links.push({ href, text: t });
    });

    return {
      text: text.slice(0, 20_000),
      htmlSnippet: `${headSnippet}\n<!-- body -->\n${bodySnippet}`,
      meta,
      headings,
      buttons,
      links,
    };
  });

  await context.close();

  // Dedupe nav links by href, keep first occurrence's text.
  const seen = new Set<string>();
  const navLinks: NavLink[] = [];
  for (const l of dump.links) {
    if (seen.has(l.href)) continue;
    seen.add(l.href);
    navLinks.push(l);
    if (navLinks.length >= 40) break;
  }

  return {
    url,
    finalUrl,
    title,
    textContent: dump.text,
    htmlSnippet: dump.htmlSnippet,
    screenshotDataUrl,
    navLinks,
    metadata: dump.meta,
    headings: dump.headings,
    buttons: Array.from(new Set(dump.buttons)).slice(0, 20),
    blocked,
  };
}

export async function closeBrowser(): Promise<void> {
  if (cached) {
    await cached.close();
    cached = null;
  }
}
