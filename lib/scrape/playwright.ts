/**
 * Playwright session helpers.
 *
 * Goal: take a URL, return a structured page capture (text + screenshot + links + og metadata)
 * suitable for an LLM extraction step.
 */

export type PageCapture = {
  url: string;
  finalUrl: string;
  title: string;
  textContent: string;
  htmlSnippet: string;
  screenshotBase64: string;
  navLinks: { href: string; text: string }[];
  metadata: Record<string, string>;
};

export type CaptureOptions = {
  timeoutMs?: number;
  maxTextChars?: number;
  maxHtmlChars?: number;
  fullPageScreenshot?: boolean;
};

const DEFAULT_TIMEOUT_MS = 25_000;
const DEFAULT_MAX_TEXT_CHARS = 12_000;
const DEFAULT_MAX_HTML_CHARS = 24_000;

export async function capturePage(
  url: string,
  opts: CaptureOptions = {},
): Promise<PageCapture> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxText = opts.maxTextChars ?? DEFAULT_MAX_TEXT_CHARS;
  const maxHtml = opts.maxHtmlChars ?? DEFAULT_MAX_HTML_CHARS;

  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1800 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    let finalUrl = url;
    try {
      const resp = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
      });
      finalUrl = resp?.url() ?? url;
    } catch {
      // Many SPAs never reach networkidle; fall back to domcontentloaded so we still get useful text.
      const resp = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });
      finalUrl = resp?.url() ?? url;
      // give hero animations a beat
      await page.waitForTimeout(1500);
    }

    const title = (await page.title()) ?? "";

    const metadata = await page.evaluate(() => {
      const out: Record<string, string> = {};
      const sel = document.querySelectorAll(
        'meta[property^="og:"], meta[name^="twitter:"], meta[name="description"], meta[name="keywords"], meta[name="author"]',
      );
      sel.forEach((el) => {
        const m = el as HTMLMetaElement;
        const key = m.getAttribute("property") || m.getAttribute("name");
        const value = m.getAttribute("content");
        if (key && value) out[key] = value;
      });
      return out;
    });

    const navLinks = await page.evaluate(() => {
      const links: { href: string; text: string }[] = [];
      const seen = new Set<string>();
      document.querySelectorAll("a[href]").forEach((el) => {
        const a = el as HTMLAnchorElement;
        const href = a.href;
        const text = (a.textContent ?? "").trim().replace(/\s+/g, " ");
        if (!href || !text || text.length > 80) return;
        if (seen.has(href)) return;
        seen.add(href);
        links.push({ href, text });
      });
      return links.slice(0, 40);
    });

    const textContentRaw = await page.evaluate(() => {
      const drop = document.querySelectorAll("script, style, noscript, svg");
      drop.forEach((n) => n.parentNode?.removeChild(n));
      return document.body?.innerText ?? "";
    });
    const textContent = textContentRaw.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").slice(0, maxText);

    const htmlSnippetRaw = await page.evaluate(() => {
      const head = document.head?.outerHTML ?? "";
      const main =
        document.querySelector("main")?.outerHTML ??
        document.querySelector("body")?.outerHTML ??
        "";
      return head + "\n" + main;
    });
    const htmlSnippet = htmlSnippetRaw.slice(0, maxHtml);

    let screenshotBase64 = "";
    try {
      const buf = await page.screenshot({
        fullPage: opts.fullPageScreenshot ?? false,
        type: "jpeg",
        quality: 70,
      });
      screenshotBase64 = Buffer.from(buf).toString("base64");
    } catch {
      // Some pages refuse screenshots (e.g. with X-Frame-Options + odd CSP). Continue without.
      screenshotBase64 = "";
    }

    return {
      url,
      finalUrl,
      title,
      textContent,
      htmlSnippet,
      screenshotBase64,
      navLinks,
      metadata,
    };
  } finally {
    await browser.close().catch(() => {});
  }
}
